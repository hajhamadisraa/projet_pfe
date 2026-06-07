# main.py — Raspberry Pi AI API
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import onnxruntime as ort

app = FastAPI(title="Smart Poulailler AI API")

session    = ort.InferenceSession("/home/pi/poulailler/best.onnx")
input_name = session.get_inputs()[0].name

# ✅ CORRECTION : ordre identique au data.yaml
# data.yaml → names: ["AbNormal", "Normal"]
# donc cls_id=0 → AbNormal, cls_id=1 → Normal
CLASS_NAMES     = ["AbNormal", "Normal"]
PREDATOR_CLASSES = ["dog", "cat", "fox", "horse", "bear", "bird"]


def preprocess(frame):
    img = cv2.resize(frame, (640, 640))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype(np.float32) / 255.0
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0)
    return img


def postprocess(outputs, conf_threshold=0.4):
    predictions = outputs[0][0]
    boxes = []
    for pred in predictions.T:
        x, y, w, h = pred[:4]
        scores     = pred[4:]
        cls_id     = int(np.argmax(scores))
        conf       = float(scores[cls_id])
        if conf >= conf_threshold:
            boxes.append({
                "class":      CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id),
                "confidence": round(conf, 3),
                "bbox":       [float(x - w/2), float(y - h/2), float(x + w/2), float(y + h/2)],
            })
    return boxes


@app.get("/")
def root():
    return {"message": "Smart Poulailler AI API", "status": "running"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    img    = np.frombuffer(await file.read(), np.uint8)
    frame  = cv2.imdecode(img, cv2.IMREAD_COLOR)
    input_tensor = preprocess(frame)
    outputs      = session.run(None, {input_name: input_tensor})
    boxes        = postprocess(outputs)

    normal   = [b for b in boxes if b["class"] == "Normal"]
    abnormal = [b for b in boxes if b["class"] == "AbNormal"]
    predators = [b for b in boxes if b["class"] in PREDATOR_CLASSES]

    return {
        "chicken_count":  len(normal),
        "abnormal_count": len(abnormal),
        "predator_alert": len(predators) > 0,
        "predators":      predators,
        "details":        {"normal": normal, "abnormal": abnormal},
    }


@app.post("/brightness")
async def brightness(file: UploadFile = File(...)):
    img   = np.frombuffer(await file.read(), np.uint8)
    frame = cv2.imdecode(img, cv2.IMREAD_COLOR)
    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    return {
        "brightness":    round(mean_brightness, 2),
        "light_command": "ON" if mean_brightness < 80 else "OFF",
    }


def generate_frames(camera_url):
    cap = cv2.VideoCapture(camera_url)
    if not cap.isOpened():
        return
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        input_tensor = preprocess(frame)
        outputs      = session.run(None, {input_name: input_tensor})
        boxes        = postprocess(outputs)

        for b in boxes:
            x1, y1, x2, y2 = [int(v) for v in b["bbox"]]
            # Vert = Normal, Rouge = AbNormal
            color = (0, 255, 0) if b["class"] == "Normal" else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                frame,
                f"{b['class']} {b['confidence']:.2f}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2,
            )

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()


@app.get("/video/stream")
def video_stream(camera_url: str = "0"):
    source = int(camera_url) if camera_url.isdigit() else camera_url
    return StreamingResponse(
        generate_frames(source),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
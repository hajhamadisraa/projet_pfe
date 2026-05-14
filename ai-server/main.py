from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import cv2
import numpy as np

app = FastAPI(title="Smart Poulailler AI API")
model = YOLO("model/best.pt")

PREDATOR_CLASSES = ["dog", "cat", "fox", "horse", "bear", "bird"]

@app.get("/")
def root():
    return {"message": "Smart Poulailler AI API", "status": "running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    img = np.frombuffer(await file.read(), np.uint8)
    frame = cv2.imdecode(img, cv2.IMREAD_COLOR)
    results = model(frame, conf=0.4, verbose=False)[0]

    normal = []
    abnormal = []
    predators = []

    for box in results.boxes:
        cls_name = model.names[int(box.cls)]
        conf = float(box.conf)
        coords = box.xyxy[0].tolist()
        if cls_name == "Normal":
            normal.append({"confidence": conf, "bbox": coords})
        elif cls_name == "AbNormal":
            abnormal.append({"confidence": conf, "bbox": coords})
        elif cls_name in PREDATOR_CLASSES:
            predators.append({"class": cls_name, "confidence": conf})

    return {
        "chicken_count": len(normal),
        "abnormal_count": len(abnormal),
        "predator_alert": len(predators) > 0,
        "predators": predators,
        "details": {"normal": normal, "abnormal": abnormal}
    }

@app.post("/brightness")
async def brightness(file: UploadFile = File(...)):
    img = np.frombuffer(await file.read(), np.uint8)
    frame = cv2.imdecode(img, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    return {
        "brightness": round(mean_brightness, 2),
        "light_command": "ON" if mean_brightness < 80 else "OFF"
    }
def generate_frames(camera_url: str):
    cap = cv2.VideoCapture(camera_url)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        results = model(frame, conf=0.4, verbose=False)[0]
        annotated = results.plot()
        _, buffer = cv2.imencode('.jpg', annotated)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
               + buffer.tobytes() + b'\r\n')

@app.get("/video/stream")
def video_stream(camera_url: str = "0"):
    source = int(camera_url) if camera_url.isdigit() else camera_url
    return StreamingResponse(
        generate_frames(source),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
def generate_frames(camera_url):
    cap = cv2.VideoCapture(camera_url)
    
    if not cap.isOpened():
        print(f"ERREUR : Impossible d'ouvrir la caméra {camera_url}")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Détection YOLOv8 sur chaque frame
        results = model(frame, conf=0.4, verbose=False)[0]
        annotated = results.plot()
        
        # Compter pour afficher sur le flux
        normal = sum(1 for b in results.boxes if model.names[int(b.cls)] == "Normal")
        abnormal = sum(1 for b in results.boxes if model.names[int(b.cls)] == "AbNormal")
        predators = [model.names[int(b.cls)] for b in results.boxes 
                     if model.names[int(b.cls)] in PREDATOR_CLASSES]
        
        # Afficher les infos sur le flux vidéo
        cv2.putText(annotated, f"Poules: {normal}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(annotated, f"Anormales: {abnormal}", (10, 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
        if predators:
            cv2.putText(annotated, f"ALERTE: {predators[0]}", (10, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Encoder en JPEG et envoyer
        _, buffer = cv2.imencode('.jpg', annotated, 
                                  [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
               + buffer.tobytes() + b'\r\n')
    
    cap.release()

@app.get("/video/stream")
def video_stream(camera_url: str = "0"):
    source = int(camera_url) if camera_url.isdigit() else camera_url
    return StreamingResponse(
        generate_frames(source),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
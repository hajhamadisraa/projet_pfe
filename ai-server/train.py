from ultralytics import YOLO

print("Nouvel entrainement depuis best.pt...")
model = YOLO("runs/poulailler_v1/weights/best.pt")
results = model.train(
    data="dataset/data.yaml",
    epochs=20,
    imgsz=640,
    batch=8,
    name="poulailler_v22",
    project="runs",
    patience=10,
    save=True,
    plots=True
)

print("Termine ! Modele : runs/poulailler_v22/weights/best.pt")
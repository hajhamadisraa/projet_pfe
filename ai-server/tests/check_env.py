import sys

print("=" * 50)
print("VERIFICATION ENVIRONNEMENT SMART POULAILLER")
print("=" * 50)

print(f"\nPython : {sys.version}")

try:
    import torch
    print(f"PyTorch      : {torch.__version__}")
    print(f"GPU dispo    : {torch.cuda.is_available()}")
except ImportError as e:
    print(f"PyTorch      : ERREUR - {e}")

try:
    import ultralytics
    print(f"Ultralytics  : {ultralytics.__version__}")
except ImportError as e:
    print(f"Ultralytics  : ERREUR - {e}")

try:
    import cv2
    print(f"OpenCV       : {cv2.__version__}")
except ImportError as e:
    print(f"OpenCV       : ERREUR - {e}")

try:
    import fastapi
    print(f"FastAPI      : {fastapi.__version__}")
except ImportError as e:
    print(f"FastAPI      : ERREUR - {e}")

try:
    import numpy as np
    print(f"NumPy        : {np.__version__}")
except ImportError as e:
    print(f"NumPy        : ERREUR - {e}")

try:
    import roboflow
    print(f"Roboflow     : {roboflow.__version__}")
except ImportError as e:
    print(f"Roboflow     : ERREUR - {e}")

print("\n" + "=" * 50)
print("Test YOLOv8 — chargement modele de base...")
print("=" * 50)

try:
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")
    print(f"yolov8n.pt   : OK")
    print(f"Nb classes   : {len(model.names)}")
    print(f"bird (47)    : {model.names.get(14, 'N/A')}")
    print(f"dog  (16)    : {model.names.get(16, 'N/A')}")
    print(f"cat  (15)    : {model.names.get(15, 'N/A')}")
except Exception as e:
    print(f"ERREUR YOLOv8 : {e}")

print("\n=> Environnement pret pour Smart Poulailler !")
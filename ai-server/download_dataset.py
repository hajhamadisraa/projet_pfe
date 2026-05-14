import os
from dotenv import load_dotenv
from roboflow import Roboflow

load_dotenv()

api_key = os.getenv("ROBOFLOW_API_KEY")
if not api_key:
    print("ERREUR : ROBOFLOW_API_KEY manquant dans .env")
    exit(1)

print("Connexion a Roboflow...")
rf = Roboflow(api_key=api_key)

WORKSPACE = "israa-haj-hamad"
PROJECT   = "chicken-detection-gkoje-9slr9"
VERSION   = 1

print("Telechargement du dataset...")
project = rf.workspace(WORKSPACE).project(PROJECT)
version = project.version(VERSION)

# Téléchargement avec chemin absolu
save_path = os.path.join(os.getcwd(), "dataset")
os.makedirs(save_path, exist_ok=True)

dataset = version.download("yolov8", location=save_path, overwrite=True)

print(f"\nDataset telecharge dans : {save_path}")

# Vérification
total = 0
for root, dirs, files in os.walk(save_path):
    for f in files:
        total += 1
        print(os.path.join(root, f).replace(save_path, "dataset"))

print(f"\nTotal fichiers : {total}")
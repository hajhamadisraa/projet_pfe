import zipfile
import os
import hashlib

zip_path = r"C:\Users\Israa\Downloads\Chicken Detection.v1i.yolov8.zip"
output_dir = r"C:\Users\Israa\Desktop\projet_pfe_Poulailler\ai-server\dataset"

os.makedirs(output_dir, exist_ok=True)

print("Extraction en cours...")
count = 0
skipped = 0

with zipfile.ZipFile(zip_path, 'r') as zf:
    for member in zf.namelist():
        # Construire le chemin de destination
        dest = os.path.join(output_dir, member)
        
        # Si le chemin est trop long, raccourcir le nom du fichier
        if len(dest) > 200:
            parts = member.split('/')
            folder = '/'.join(parts[:-1])
            filename = parts[-1]
            # Garder l'extension et créer un nom court avec hash
            ext = os.path.splitext(filename)[1]
            short_name = hashlib.md5(filename.encode()).hexdigest()[:12] + ext
            member_short = folder + '/' + short_name
            dest = os.path.join(output_dir, member_short)
        
        # Créer les dossiers si nécessaire
        if member.endswith('/'):
            os.makedirs(dest, exist_ok=True)
            continue
            
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        
        # Extraire le fichier
        try:
            with zf.open(member) as src, open(dest, 'wb') as tgt:
                tgt.write(src.read())
            count += 1
            if count % 100 == 0:
                print(f"  {count} fichiers extraits...")
        except Exception as e:
            skipped += 1

print(f"\nTermine ! {count} fichiers extraits, {skipped} ignores")
print("\nStructure du dataset :")
for item in os.listdir(output_dir):
    print(f"  {item}/")
    sub = os.path.join(output_dir, item)
    if os.path.isdir(sub):
        files = os.listdir(sub)
        print(f"    ({len(files)} elements)")
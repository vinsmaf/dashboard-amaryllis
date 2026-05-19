#!/usr/bin/env python3
"""Convertit les 22 photos retouchées d'Amaryllis en webp → public/photos/amaryllis/"""

import os
from PIL import Image

SRC  = "/Users/vincentsalomon/Downloads/retouches/dossier sans titre"
DEST = "/Users/vincentsalomon/locatif-dashboard/public/photos/amaryllis"
MAX_SIZE = 1600
QUALITY  = 88

SELECTION = [
    "01-piscine-sunset.jpg",
    "02-villa-dusk-front.jpg",
    "03-villa-dusk-pool.jpg",
    "04-terrasse-palapa.jpg",
    "05-vue-piscine-rideaux.jpg",
    "06-piscine-statues.jpg",
    "07-salon-cuisine.jpg",
    "08-terrasse-nuit-leds.jpg",
    "09-apero-piscine.jpg",
    "10-piscine-cote-villa.jpg",
    "11-palapa-hammac.jpg",
    "12-palapa-interieur.jpg",
    "13-palapa-table-dressee.jpg",
    "14-salon-vue-terrasse.jpg",
    "15-salon-cuisine-jour.jpg",
    "16-cuisine-vue-piscine.jpg",
    "17-chambre-rouge-jardin.jpg",
    "18-chambre-rouge-palmiers.jpg",
    "19-sdb-ardoise.jpg",
    "20-chambre-mer.jpg",
    "21-chambre-tableau.jpg",
    "22-sdb-ardoise-bis.jpg",
]

os.makedirs(DEST, exist_ok=True)

for i, filename in enumerate(SELECTION, 1):
    src_path  = os.path.join(SRC, filename)
    dest_path = os.path.join(DEST, f"{i:02d}.webp")
    img = Image.open(src_path).convert("RGB")
    img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
    img.save(dest_path, "WEBP", quality=QUALITY, method=6)
    size_kb = os.path.getsize(dest_path) // 1024
    print(f"  {i:02d}.webp ← {filename} ({img.size[0]}×{img.size[1]}, {size_kb} kB)")

print(f"\n✅ {len(SELECTION)} photos importées dans {DEST}")

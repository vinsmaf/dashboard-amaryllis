#!/usr/bin/env python3
"""Download + retouch Airbnb photos for each bien → public/photos/{bienId}/01.webp…"""

import os, sys, urllib.request, io
from PIL import Image, ImageEnhance

BASE = "https://a0.muscache.com/im/pictures/"
OUT  = os.path.join(os.path.dirname(__file__), "public", "photos")

BIENS = {
    "amaryllis": [
        "miso/Hosting-54269844/original/735d43eb-5738-440a-965a-795113b942b0.jpeg",
        "hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NTQyNjk4NDQ=/original/f09065db-ef09-440c-9631-fffa796042eb.jpeg",
        "hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NTQyNjk4NDQ=/original/ed612b06-7abf-49d8-97b3-344bfa556264.jpeg",
        "miso/Hosting-54269844/original/9bbddd9d-0b65-4705-a51a-dda4c1c9e439.jpeg",
        "hosting/Hosting-54269844/original/7ddc5186-f42b-4706-98c1-9163aab4dc6d.jpeg",
        "hosting/Hosting-54269844/original/7cf0632d-d6e5-4ace-be28-ee7ea04a6da8.jpeg",
        "hosting/Hosting-54269844/original/aa231018-21cf-49fe-ad7d-a6f188776d50.jpeg",
        "hosting/Hosting-54269844/original/5965cd5b-36f3-44f5-a2ca-f0358da5611d.jpeg",
        "hosting/Hosting-54269844/original/62fe1f4b-ac97-430d-98c2-b48f3beae2ca.jpeg",
        "hosting/Hosting-54269844/original/b9629566-58cf-4efd-b14d-e879bf7cd55b.jpeg",
        "miso/Hosting-54269844/original/28f3ff6e-2e95-4c92-9655-c340a40e084f.jpeg",
        "miso/Hosting-54269844/original/4614fb40-ee94-46de-abe8-674a7cdaebd7.jpeg",
        "miso/Hosting-54269844/original/91ed2adf-857e-40c5-a786-a482ddd4fcd6.jpeg",
        "miso/Hosting-54269844/original/a4f940d3-de1d-48b0-951e-33ab04a9d5e7.jpeg",
        "hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NTQyNjk4NDQ=/original/1bb9aa2e-d66e-4e97-bb09-5168cbae2af8.jpeg",
    ],
    "zandoli": [
        "hosting/Hosting-792768220924504884/original/87d71613-6f4b-4730-8101-c15f88d34221.jpeg",
        "hosting/Hosting-792768220924504884/original/417079fe-ae00-458f-b589-4b61487788d5.jpeg",
        "hosting/Hosting-792768220924504884/original/f3de185b-36ac-4bc7-8a28-ddf2aab2dd68.jpeg",
        "hosting/Hosting-792768220924504884/original/6c090336-0211-4c51-8f66-6e760a37fee9.jpeg",
        "hosting/Hosting-792768220924504884/original/64c63a70-79ad-4626-92d4-d20c5916349b.jpeg",
        "hosting/Hosting-792768220924504884/original/0d917d3e-7143-45b8-88f1-8cc00103995a.jpeg",
        "hosting/Hosting-792768220924504884/original/1d35a2c9-6d90-4363-8c10-281e2983786f.jpeg",
        "hosting/Hosting-792768220924504884/original/3823de0b-de7a-4c2a-89aa-fe28e78097fa.jpeg",
        "hosting/Hosting-792768220924504884/original/494a2697-5cda-471d-89e4-d30e74dc7c4c.jpeg",
        "hosting/Hosting-792768220924504884/original/4adfea3f-88c2-44a2-a8de-bf43c21dd544.jpeg",
        "hosting/Hosting-792768220924504884/original/8ece27f2-908c-4bce-8e97-275a825af48c.jpeg",
        "hosting/Hosting-792768220924504884/original/a6877cdd-5c37-42a6-9038-b24fb02427eb.jpeg",
        "hosting/Hosting-792768220924504884/original/ae484ff0-396a-4716-ac70-75d6978bd32c.jpeg",
        "hosting/Hosting-792768220924504884/original/d8f3f80e-1bdd-4610-8fad-c26e53f9caeb.jpeg",
        "hosting/Hosting-792768220924504884/original/e6fa0a65-9520-4b46-b384-b60eac3f3792.jpeg",
    ],
    "iguana": [
        "miso/Hosting-661013712794640840/original/f2c846ce-3c86-4e8a-8c21-7d1c0190ad63.jpeg",
        "hosting/Hosting-661013712794640840/original/47f479ea-6667-492b-929d-616ed86b0791.jpeg",
        "hosting/Hosting-661013712794640840/original/75d25207-78db-4d3c-a9d4-79c152383aa3.jpeg",
        "hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6NjYxMDEzNzEyNzk0NjQwODQw/original/f343b178-6e0f-4b41-8944-33da5ae3ba36.jpeg",
        "afdbde92-b993-4561-b150-114f36bfe545.jpg",
        "dc251801-0050-4edc-8bec-d347c4ffa7bf.jpg",
        "hosting/Hosting-661013712794640840/original/2f3bc07b-a832-43c9-82df-5e1e9ef0ce59.jpeg",
        "hosting/Hosting-661013712794640840/original/6d0c706e-f5a5-4cf8-a224-742b42a7d294.jpeg",
        "hosting/Hosting-661013712794640840/original/81c4f0ac-04a8-4389-822b-99790529e32e.jpeg",
        "hosting/Hosting-661013712794640840/original/971a0930-db5a-4a73-9f9e-5bf3bf6b99f7.jpeg",
        "hosting/Hosting-661013712794640840/original/dad77daf-4df6-4b59-b5ef-4cc77c6ac1e1.jpeg",
        "hosting/Hosting-661013712794640840/original/e57997c2-b1d0-419e-b074-6bb17e6a7ade.jpeg",
        "miso/Hosting-661013712794640840/original/03a91f73-5a40-48dc-8089-207a35cc5bfb.jpeg",
        "miso/Hosting-661013712794640840/original/42a7c72d-6fd7-4cc3-b999-ad126aa15799.jpeg",
        "miso/Hosting-661013712794640840/original/5229aa06-49f5-45d6-a684-b4f4ce610f68.jpeg",
    ],
    "geko": [
        "hosting/Hosting-1263155865459755724/original/62cb1f91-7147-483b-b4c7-0cba1b717f28.jpeg",
        "hosting/Hosting-1263155865459755724/original/ec05d0b0-3284-4844-8cac-c4800d4f6b0b.jpeg",
        "hosting/Hosting-1263155865459755724/original/60c58f78-a59b-4da2-aa05-576b65cf9ab9.jpeg",
        "hosting/Hosting-1263155865459755724/original/b501ee9a-e617-495e-9ee9-6552c83160a2.jpeg",
        "hosting/Hosting-1263155865459755724/original/44a86db1-fb7e-49f0-bd8f-5760fabe76ed.jpeg",
        "hosting/Hosting-1263155865459755724/original/246aba5a-2bce-4fdc-9f7b-4bbfba0d4892.jpeg",
        "hosting/Hosting-1263155865459755724/original/47c2f63e-c65a-4531-a426-1641aba33311.jpeg",
        "hosting/Hosting-1263155865459755724/original/53d3e44b-e49a-4518-8512-bba80f005a2c.jpeg",
        "hosting/Hosting-1263155865459755724/original/5b3c1a5d-9e7c-4bff-8632-6c7f53be0a32.jpeg",
        "hosting/Hosting-1263155865459755724/original/6510cd67-7d2e-492f-9bac-abd4f3a9dc43.jpeg",
        "hosting/Hosting-1263155865459755724/original/6e01112c-f782-40d0-be94-429e91e311b3.jpeg",
        "hosting/Hosting-1263155865459755724/original/74f9a4f1-9076-4dbe-8837-4dc159acda16.jpeg",
        "hosting/Hosting-1263155865459755724/original/902436e6-4fc9-42e1-9dd7-e61fb379d31c.jpeg",
        "hosting/Hosting-1263155865459755724/original/960e96a5-cfc4-443b-b06e-16c12736c08d.jpeg",
        "hosting/Hosting-1263155865459755724/original/fdeaaae5-7a25-4002-be6f-39b5c58fa193.jpeg",
    ],
    "mabouya": [
        "miso/Hosting-1046596752160926069/original/61cd5a5f-0a20-4043-ba57-9b35d7dd276a.jpeg",
        "miso/Hosting-1046596752160926069/original/267544c9-a0f4-497b-9506-1c617f9dd304.jpeg",
        "miso/Hosting-1046596752160926069/original/bd7afe4d-5863-4bb3-898e-79377737c5e3.jpeg",
        "miso/Hosting-1046596752160926069/original/5414f301-4647-49af-b4f3-2ad10985eb29.jpeg",
        "miso/Hosting-1046596752160926069/original/f68c6704-d68b-4001-b671-f3c2eb009ebd.jpeg",
        "miso/Hosting-1046596752160926069/original/13439355-ec9a-48d7-8eb7-1e90a56bce6b.jpeg",
        "miso/Hosting-1046596752160926069/original/2fbd5ccd-78d3-4fe9-a45c-417764e88881.jpeg",
        "miso/Hosting-1046596752160926069/original/9b57c1b0-e458-4d3b-9a8a-184b9ae85c3c.jpeg",
        "miso/Hosting-1046596752160926069/original/bb7ed5a4-25e5-45b7-ba4c-4104253b8204.jpeg",
        "miso/Hosting-1046596752160926069/original/bf989dcf-8cb6-4046-94e2-f22debbc2e4e.jpeg",
        "miso/Hosting-1046596752160926069/original/f2a874eb-d41b-4469-b3dd-625ca45de42d.jpeg",
        "miso/Hosting-1046596752160926069/original/fadd2f48-a450-4da2-af51-f7a88d9c4b27.jpeg",
    ],
    "schoelcher": [
        "miso/Hosting-24242415/original/8fa46b75-28f0-4b0c-bfc7-24a4ccd323fd.jpeg",
        "miso/Hosting-24242415/original/271329a6-0166-4654-a6df-cabafa456deb.jpeg",
        "hosting/Hosting-24242415/original/c2d6324a-715f-4567-acf8-5722ea54e2e2.jpeg",
        "miso/Hosting-24242415/original/d05cb282-f261-4f54-9211-90766aaa2684.jpeg",
        "67d28a00-2b86-48c8-ad24-101fe136aa8a.jpg",
        "hosting/Hosting-24242415/original/bcbd7ef6-5ea1-4213-ae12-886b19b15af1.jpeg",
        "hosting/Hosting-24242415/original/70ffd2df-1f7c-434e-a8d7-536151325542.jpeg",
        "hosting/Hosting-24242415/original/78becb83-d01b-4377-bf37-eb228e133893.jpeg",
        "hosting/Hosting-24242415/original/81d238c4-409b-4413-b831-4b0840bb036b.jpeg",
        "hosting/Hosting-24242415/original/87f96dde-1098-4779-bcae-b9daacb96a32.jpeg",
        "hosting/Hosting-24242415/original/9727429a-26f9-4491-b8a3-9d77484ab69b.jpeg",
        "hosting/Hosting-24242415/original/a7cc1c5a-0503-4355-ab4b-e1eb48daaf12.jpeg",
        "hosting/Hosting-24242415/original/ac952a2b-ef3b-47e3-b517-fe973380b875.jpeg",
        "hosting/Hosting-24242415/original/aefef39f-f1d5-492a-aec1-c881068dfe1f.jpeg",
        "hosting/Hosting-24242415/original/e17e3e47-0262-4e51-9438-99e7b4af4427.jpeg",
    ],
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": "https://www.airbnb.fr/",
}

MAX_SIZE   = 1600   # px longest side
BRIGHTNESS = 1.05   # +5%
CONTRAST   = 1.10   # +10%
SATURATION = 1.08   # +8%
SHARPNESS  = 1.30   # ×1.3
QUALITY    = 88


def retouch(img: Image.Image) -> Image.Image:
    # Convert to RGB (drop alpha if any)
    img = img.convert("RGB")
    # Resize
    img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
    # Enhance
    img = ImageEnhance.Brightness(img).enhance(BRIGHTNESS)
    img = ImageEnhance.Contrast(img).enhance(CONTRAST)
    img = ImageEnhance.Color(img).enhance(SATURATION)
    img = ImageEnhance.Sharpness(img).enhance(SHARPNESS)
    return img


def download(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    except Exception as e:
        print(f"  ✗ download error: {e}", file=sys.stderr)
        return None


def process_bien(bien_id: str, paths: list[str]):
    out_dir = os.path.join(OUT, bien_id)
    os.makedirs(out_dir, exist_ok=True)
    ok = 0
    for i, path in enumerate(paths, 1):
        dest = os.path.join(out_dir, f"{i:02d}.webp")
        if os.path.exists(dest):
            print(f"  {i:02d}.webp already exists, skip")
            ok += 1
            continue
        url = BASE + path
        print(f"  [{i:02d}/{len(paths)}] {path[-50:]}")
        data = download(url)
        if not data:
            continue
        try:
            img = Image.open(io.BytesIO(data))
            img = retouch(img)
            img.save(dest, "WEBP", quality=QUALITY, method=6)
            size_kb = os.path.getsize(dest) // 1024
            print(f"    → {dest} ({size_kb} kB, {img.size[0]}×{img.size[1]})")
            ok += 1
        except Exception as e:
            print(f"    ✗ PIL error: {e}", file=sys.stderr)
    return ok


if __name__ == "__main__":
    total = 0
    for bien_id, paths in BIENS.items():
        print(f"\n── {bien_id} ({len(paths)} photos) ──")
        n = process_bien(bien_id, paths)
        print(f"  ✓ {n}/{len(paths)} done")
        total += n
    print(f"\n✅ Total: {total} photos retouchées")

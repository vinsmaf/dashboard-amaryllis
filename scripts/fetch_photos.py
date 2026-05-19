#!/usr/bin/env python3
"""
Fetch Airbnb photos for each bien, retouch and save as WebP.
"""
import os
import re
import sys
import time
import urllib.request
import urllib.error

BIENS = [
    {"id": "amaryllis",  "listing_id": "54269844"},
    {"id": "zandoli",    "listing_id": "792768220924504884"},
    {"id": "iguana",     "listing_id": "661013712794640840"},
    {"id": "geko",       "listing_id": "1263155865459755724"},
    {"id": "mabouya",    "listing_id": "1046596752160926069"},
    {"id": "schoelcher", "listing_id": "24242415"},
    {"id": "nogent",     "listing_id": None},  # à trouver
]

NOGENT_SEARCH_TITLE = "Appartement de standing avec jardin, proche Paris"

BASE_DIR = "/Users/vincentsalomon/locatif-dashboard/public/photos"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# Patterns indésirables (pas des photos de logement)
EXCLUDE_PATTERNS = [
    "AirbnbPlatformAssets",
    "UserProfile",
    "airbnb-platform-assets",
    "search-bar-icons",
    "Favicons",
]


def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        import gzip
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
            if resp.info().get("Content-Encoding") == "gzip":
                data = gzip.decompress(data)
            return data.decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return None


def extract_photos(html, listing_id):
    """Extract unique photo URLs from Airbnb HTML, filtered to listing photos."""
    urls = re.findall(r'https://a0\.muscache\.com/im/pictures/[^"\'\\>\s]+', html)
    seen = set()
    unique = []
    for u in urls:
        # Nettoyer les paramètres query et les entités HTML
        u = u.split("?")[0].replace("&amp;", "")
        # Exclure les assets non-photos
        if any(pat in u for pat in EXCLUDE_PATTERNS):
            continue
        # Préférer les URLs avec /original/ ou qui contiennent l'ID du listing
        key = u.split("/")[-1]
        if key not in seen:
            seen.add(key)
            unique.append(u)

    # Trier : /original/ et URLs avec listing_id en premier
    def score(u):
        s = 0
        if "/original/" in u:
            s += 2
        if listing_id and listing_id in u:
            s += 1
        return -s  # négatif pour trier décroissant

    unique.sort(key=score)
    return unique


def download_photo(url, dest_path):
    """Download a photo to dest_path. Returns True on success."""
    # Normaliser l'URL pour avoir /original/ si possible
    url_clean = url.split("?")[0]
    if "im_w=" in url or "width=" in url:
        url_clean = re.sub(r'\?.*', '', url)

    req = urllib.request.Request(url_clean, headers={
        **HEADERS,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(dest_path, "wb") as f:
            f.write(data)
        size = os.path.getsize(dest_path)
        print(f"    OK {os.path.basename(dest_path)} ({size//1024} KB)")
        return True
    except Exception as e:
        print(f"    FAIL {url_clean}: {e}")
        return False


def find_nogent_listing():
    """Try to find Nogent listing ID by searching Airbnb."""
    # Essayer de chercher directement via une URL de recherche
    search_url = "https://www.airbnb.fr/s/Nogent-sur-Marne--Val-de-Marne--France/homes"
    html = fetch_url(search_url)
    if not html:
        return None
    # Chercher des IDs de listings dans la page
    ids = re.findall(r'/rooms/(\d+)', html)
    if ids:
        # Retourner le premier ID trouvé
        return ids[0]
    return None


def process_bien(bien):
    bid = bien["id"]
    listing_id = bien["listing_id"]
    folder = os.path.join(BASE_DIR, bid)
    os.makedirs(folder, exist_ok=True)

    print(f"\n{'='*50}")
    print(f"Processing: {bid} (Airbnb ID: {listing_id})")
    print(f"{'='*50}")

    if listing_id is None:
        # Cas Nogent : essayer de trouver l'ID
        print(f"  Searching for Nogent listing...")
        listing_id = find_nogent_listing()
        if listing_id:
            print(f"  Found Nogent listing ID: {listing_id}")
        else:
            print(f"  Could not find Nogent listing, using known photos")
            return []

    # Fetch Airbnb listing page
    url = f"https://www.airbnb.fr/rooms/{listing_id}"
    print(f"  Fetching {url}...")
    html = fetch_url(url)
    if not html:
        print(f"  FAILED to fetch listing page")
        return []

    photos = extract_photos(html, listing_id)
    print(f"  Found {len(photos)} unique photo URLs")

    if not photos:
        print(f"  No photos found!")
        return []

    # Afficher les 20 premières pour debug
    print(f"  First {min(20, len(photos))} photos:")
    for u in photos[:20]:
        print(f"    {u}")

    # Télécharger les 15 premières
    downloaded = []
    count = 0
    for i, photo_url in enumerate(photos):
        if count >= 15:
            break
        ext = "jpeg" if photo_url.endswith(".jpeg") else "jpg"
        dest = os.path.join(folder, f"{count+1:02d}.{ext}")
        if download_photo(photo_url, dest):
            downloaded.append(dest)
            count += 1
        time.sleep(0.3)  # polite delay

    print(f"  Downloaded {count} photos for {bid}")
    return downloaded


if __name__ == "__main__":
    all_results = {}
    for bien in BIENS:
        downloaded = process_bien(bien)
        all_results[bien["id"]] = downloaded

    print("\n\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    for bid, files in all_results.items():
        print(f"  {bid}: {len(files)} photos")

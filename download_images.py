import os
import urllib.request
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

os.makedirs('images', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

with open('scraped_original.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

image_urls = set()

# 1. <img> tags
for img in soup.find_all('img'):
    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
    if src:
        image_urls.add(src)
    srcset = img.get('srcset')
    if srcset:
        for part in srcset.split(','):
            u = part.strip().split(' ')[0]
            if u:
                image_urls.add(u)

# 2. background images in inline styles
for el in soup.find_all(style=True):
    style = el.get('style', '')
    urls = re.findall(r'url\([\'"]?(.*?)[\'"]?\)', style)
    for u in urls:
        image_urls.add(u)

# Also check other pages on shapeurmind.org to extract all their pictures!
other_pages = [
    'https://shapeurmind.org/about-us/',
    'https://shapeurmind.org/services/',
    'https://shapeurmind.org/contact-us/',
    'https://shapeurmind.org/appointment/',
    'https://shapeurmind.org/blog/'
]

for page_url in other_pages:
    print(f"Scraping images from {page_url}...")
    try:
        req = urllib.request.Request(page_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            page_html = resp.read().decode('utf-8', errors='ignore')
            page_soup = BeautifulSoup(page_html, 'html.parser')
            for img in page_soup.find_all('img'):
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src:
                    image_urls.add(src)
            for el in page_soup.find_all(style=True):
                style = el.get('style', '')
                urls = re.findall(r'url\([\'"]?(.*?)[\'"]?\)', style)
                for u in urls:
                    image_urls.add(u)
    except Exception as e:
        print(f"Error scraping {page_url}: {e}")

print(f"\nTotal unique image URLs found: {len(image_urls)}")

downloaded = {}
for idx, raw_url in enumerate(sorted(image_urls)):
    # Clean URL
    url = raw_url.strip()
    if url.startswith('//'):
        url = 'https:' + url
    elif not url.startswith('http'):
        url = urljoin('https://shapeurmind.org', url)
    
    # Filter out empty or data: urls
    if url.startswith('data:') or not url.startswith('http'):
        continue
    
    # Determine local file name
    path = urlparse(url).path
    filename = os.path.basename(path)
    if not filename or '.' not in filename:
        filename = f"image_{idx}.jpg"
    
    # Clean filename
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
    local_path = os.path.join('images', clean_name)
    
    print(f"Downloading [{idx+1}/{len(image_urls)}]: {url} -> {clean_name}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            with open(local_path, 'wb') as out_f:
                out_f.write(content)
        downloaded[url] = f"images/{clean_name}"
        print(f"  Saved ({len(content)} bytes)")
    except Exception as e:
        print(f"  Failed: {e}")

print(f"\nSuccessfully downloaded {len(downloaded)} images.")
with open('downloaded_images.json', 'w', encoding='utf-8') as jf:
    import json
    json.dump(downloaded, jf, indent=2)

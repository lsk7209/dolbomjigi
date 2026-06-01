import json
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


WIDTH = 1200
HEIGHT = 630
TARGET_RATIO = WIDTH / HEIGHT


def crop_to_ratio(image, seed):
    random.seed(seed)
    width, height = image.size
    ratio = width / height
    if ratio > TARGET_RATIO:
        crop_width = int(height * TARGET_RATIO)
        max_left = width - crop_width
        left = int(max_left * random.uniform(0.08, 0.92))
        return image.crop((left, 0, left + crop_width, height))

    crop_height = int(width / TARGET_RATIO)
    max_top = height - crop_height
    top = int(max_top * random.uniform(0.04, 0.58))
    return image.crop((0, top, width, top + crop_height))


def variant(image, seed):
    random.seed(seed)
    image = crop_to_ratio(image, seed).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    if seed % 2 == 0:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    zoom = 1 + random.uniform(0.0, 0.08)
    if zoom > 1.01:
        zoomed = image.resize((int(WIDTH * zoom), int(HEIGHT * zoom)), Image.Resampling.LANCZOS)
        left = int((zoomed.width - WIDTH) * random.random())
        top = int((zoomed.height - HEIGHT) * random.random())
        image = zoomed.crop((left, top, left + WIDTH, top + HEIGHT))

    image = ImageEnhance.Color(image).enhance(random.uniform(0.86, 1.16))
    image = ImageEnhance.Contrast(image).enhance(random.uniform(0.92, 1.12))
    image = ImageEnhance.Brightness(image).enhance(random.uniform(0.94, 1.08))

    if seed % 5 == 0:
        image = image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=3))

    # Subtle editorial gradient/vignette. No text, no logos.
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pixels = overlay.load()
    hue = [
        (21, 84, 125),
        (32, 112, 89),
        (95, 65, 143),
        (125, 82, 32),
        (64, 92, 118),
    ][seed % 5]
    direction = seed % 4
    for y in range(HEIGHT):
        for x in range(WIDTH):
            dx = x / WIDTH
            dy = y / HEIGHT
            if direction == 0:
                amount = max(0, 1 - dx) * 42
            elif direction == 1:
                amount = max(0, dx) * 38
            elif direction == 2:
                amount = max(0, 1 - dy) * 32
            else:
                distance = math.sqrt((dx - 0.5) ** 2 + (dy - 0.5) ** 2)
                amount = min(44, distance * 70)
            pixels[x, y] = (*hue, int(amount))

    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    return image


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: create-blog-cover-variants.py <manifest.json>")

    manifest_path = Path(sys.argv[1])
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cache = {}
    count = 0
    for item in manifest:
        source = Path(item["source"])
        out = Path(item["out"])
        seed = int(item["seed"])
        if out.exists() and out.stat().st_size > 35_000 and not item.get("force"):
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        if source not in cache:
            cache[source] = Image.open(source).convert("RGB")
        image = variant(cache[source], seed)
        image.save(out, quality=84, optimize=True, progressive=True)
        count += 1
    print(json.dumps({"ok": True, "created": count, "total": len(manifest)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

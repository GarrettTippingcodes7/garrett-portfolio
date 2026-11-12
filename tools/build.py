#!/usr/bin/env python3
"""
Keeps every page in sync. Run from the project folder:

    python3 tools/build.py

What it does to each *.html page in the project root (safe to run any number of times):

1. Header  - replaces everything between <!-- site-header current="..." --> and <!-- /site-header -->
             with partials/header.html, and marks the matching nav link as the current page.
2. Footer  - replaces everything between <!-- site-footer --> (or <!-- site-footer cta -->) and
             <!-- /site-footer --> with partials/footer.html. The block between <!-- cta --> and
             <!-- /cta --> in the partial is kept only when the marker says "cta".
3. Paths   - makes local links and assets root-relative ("about.html" -> "/about.html") so every page,
             including the 404 page at any depth, finds its CSS, JS and images.
4. Images  - wraps <img src="/assets/....png|jpg"> in a <picture> with the .avif version when one
             exists next to it, so modern browsers get the small file and older ones the original.
             If a "<name>.light.avif" also exists (for images with see-through areas, flattened onto the
             light background), it is added as data-light and swapped in by main.js in light mode.

To add a page: copy an existing one, keep the two marker pairs, change the content, run this script.
To add an image: drop the .png/.jpg in assets/img (optionally an .avif with the same name), reference
the .png/.jpg in your HTML, run this script.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEADER = (ROOT / "partials" / "header.html").read_text().rstrip("\n")
FOOTER = (ROOT / "partials" / "footer.html").read_text().rstrip("\n")

HEADER_RE = re.compile(r'(<!-- site-header current="([^"]*)" -->\n).*?(\n\s*<!-- /site-header -->)', re.S)
FOOTER_RE = re.compile(r'(<!-- site-footer( cta)? -->\n).*?(\n\s*<!-- /site-footer -->)', re.S)
CTA_RE = re.compile(r'\s*<!-- cta -->.*?<!-- /cta -->', re.S)
URL_RE = re.compile(r'(\s(?:href|src|content)=")(?!/|#|https?:|mailto:|tel:|data:)([\w./-]+\.(?:html|css|js|png|jpe?g|svg|avif|webp|pdf)(?:#[\w-]*)?)"')
IMG_RE = re.compile(r'(?<!type="image/avif">)<img src="(/assets/[^"]+)\.(png|jpe?g)"')


def header_for(current):
    out = HEADER.replace(' aria-current="page"', "")
    if current:
        out = out.replace(f'href="/{current}"', f'href="/{current}" aria-current="page"', 1)
    return out


def footer_for(cta):
    return FOOTER if cta else CTA_RE.sub("", FOOTER)


def wrap_img(m):
    base, ext = m.group(1), m.group(2)
    if not (ROOT / (base.lstrip("/") + ".avif")).exists():
        return m.group(0)
    light = f' data-light="{base}.light.avif"' if (ROOT / (base.lstrip("/") + ".light.avif")).exists() else ""
    return f'<picture><source srcset="{base}.avif"{light} type="image/avif"><img src="{base}.{ext}"'


SRC_RE = re.compile(r'<source srcset="(/assets/[^"]+)\.avif" type="image/avif">')


def add_light(m):
    base = m.group(1)
    if not (ROOT / (base.lstrip("/") + ".light.avif")).exists():
        return m.group(0)
    return f'<source srcset="{base}.avif" data-light="{base}.light.avif" type="image/avif">'


def fix_picture_close(html):
    # close each <picture> right after the <img> it wraps (only ones we opened and haven't closed yet)
    return re.sub(r'(<picture><source [^>]+>)(<img [^>]*>)(?!</picture>)', r'\1\2</picture>', html)


changed = []
for page in sorted(ROOT.glob("*.html")):
    html = page.read_text()
    new = HEADER_RE.sub(lambda m: m.group(1) + header_for(m.group(2)) + m.group(3), html)
    new = FOOTER_RE.sub(lambda m: m.group(1) + footer_for(bool(m.group(2))) + m.group(3), new)
    new = URL_RE.sub(r'\1/\2"', new)
    new = IMG_RE.sub(wrap_img, new)
    new = fix_picture_close(new)
    new = SRC_RE.sub(add_light, new)
    if new != html:
        page.write_text(new)
        changed.append(page.name)

print("updated:", ", ".join(changed) if changed else "nothing (already in sync)")

"""Bundle deploy/ into one self-contained dist/index.html (CSS, JS and images inlined).

For hosts that only accept a single HTML file, such as the Cloudflare dashboard uploader.
Usage: python3 tools/build_single.py
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'deploy', ROOT / 'dist'

def data_uri(path):
    mime = {'.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'}[path.suffix]
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

def webp(name):  # 'assets/img/x.jpg' -> data URI of the WebP twin (well supported, much smaller than JPEG)
    return data_uri(SRC / re.sub(r'\.(jpg|avif|webp)$', '.webp', name))

html = (SRC / 'index.html').read_text()
css = (SRC / 'css/site.css').read_text()

# Film backgrounds: pulled out of the head so they never delay the first paint. The couple
# photo is not embedded twice: the film reuses the hero <img> (see the script added below).
film_rules = re.findall(r'\.film\.ready \.bg\.(\w+)\{background-image:url\(\.\./(assets/img/[\w-]+)\.jpg\);background-image:image-set\([^;]*?\)\)\}\n?', css)
css = re.sub(r'\.film\.ready \.bg\.\w+\{background-image:url\(\.\./assets/img/[^}]*\}\n?', '', css)
assert 'assets/img' not in css
late_css = ''.join(f'.film.ready .bg.{cls}{{background-image:url({webp(path + ".jpg")})}}\n' for cls, path in film_rules if cls != 'couple')
reuse_hero = ("document.querySelectorAll('.film .bg.couple').forEach(b => "
              "b.style.backgroundImage = `url(${document.querySelector('.arch img').src})`);")

# <picture> elements become a single <img> with the WebP inlined; keep the <img> attributes
def flatten(m):
    img = m.group(1)
    src = re.search(r'src="(assets/img/[^"]+)"', img).group(1)
    big = re.sub(r'-640\.', '-1086.', src) if 'couple-photo' in src and 'fetchpriority' in img else src
    img = re.sub(r'\s(srcset|sizes)="[^"]*"', '', img)
    return img.replace(f'src="{src}"', f'src="{webp(big)}"')
html = re.sub(r'<picture>(?:<source[^>]*>)*(<img[^>]*>)</picture>', flatten, html)
html = re.sub(r'<img class="emb" src="(assets/img/[^"]+)"', lambda m: f'<img class="emb" src="{webp(m.group(1))}"', html)
html = re.sub(r' data-full="[^"]*"', '', html)              # lightbox falls back to the tile image
html = re.sub(r'<link rel="preload" as="image"[^>]*>\n', '', html)
html = html.replace('href="assets/icons/favicon.svg"', f'href="{data_uri(SRC / "assets/icons/favicon.svg")}"')
html = html.replace('href="assets/icons/favicon-32.png"', f'href="{data_uri(SRC / "assets/icons/favicon-32.png")}"')
html = html.replace('href="assets/icons/apple-touch-icon.png"', f'href="{data_uri(SRC / "assets/icons/apple-touch-icon.png")}"')

# inline the stylesheet and scripts
html = html.replace('<link rel="stylesheet" href="css/site.css">', f'<style>\n{css}</style>')
for js in ['countdown', 'main', 'union']:
    code = (SRC / f'js/{js}.js').read_text()
    html = html.replace(f'<script src="js/{js}.js" defer></script>', f'<script>\n{code}</script>')
# inline scripts run immediately, so move them to the end of <body> (they already are) and drop "defer" reliance
html = html.replace('</body>', f'<style>\n{late_css}</style>\n<script>{reuse_hero}</script>\n</body>')
leftover = re.findall(r'(?:src|href)="(?:assets|css|js)/[^"]*"', html)
assert not leftover, leftover
OUT.mkdir(exist_ok=True)
(OUT / 'index.html').write_text(html)
print(f'dist/index.html: {len(html) // 1024} KB')

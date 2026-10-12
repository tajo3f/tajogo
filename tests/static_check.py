from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
refs = re.findall(r'(?:src|href)="([^"]+)"', html)
missing=[]
for ref in refs:
    if ref.startswith(('http://','https://','#','data:')):
        continue
    if not (root/ref).exists():
        missing.append(ref)
if missing:
    raise SystemExit('Missing assets: '+', '.join(missing))
print('Static asset check: OK')

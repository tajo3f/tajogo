from pathlib import Path

roots = [Path('index.html'), Path('assets/js'), Path('assets/css')]
files = []
for root in roots:
    if root.is_file():
        files.append(root)
    elif root.exists():
        files.extend(p for p in root.rglob('*') if p.is_file())

bad = []
for p in files:
    text = p.read_text(errors='ignore')
    for needle in ('SUPABASE_SECRET_KEY', 'sb_secret_', 'SUPABASE_SERVICE_ROLE_KEY'):
        if needle in text:
            bad.append(f'{p}: leaked marker {needle}')
    if 'tajoTapState' in text:
        bad.append(f'{p}: legacy business localStorage key still present')

if bad:
    raise SystemExit('\n'.join(bad))
print('Frontend secret/localStorage check: OK')

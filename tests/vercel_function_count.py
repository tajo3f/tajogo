from pathlib import Path

root = Path(__file__).resolve().parents[1]
api = root / 'api'
functions = [p for p in api.rglob('*') if p.is_file() and p.suffix in {'.js', '.mjs', '.cjs', '.ts'}]
limit = 12
if len(functions) > limit:
    raise SystemExit(f'Vercel Hobby function limit exceeded: {len(functions)} > {limit}: ' + ', '.join(str(p.relative_to(root)) for p in functions))
print(f'Vercel Hobby function count: OK ({len(functions)}/{limit})')

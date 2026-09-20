from pathlib import Path
import re
import sys

PATTERNS = {
    'tel': re.compile(r'tel:[^"\'\s<>]+', re.I),
    'whatsapp': re.compile(r'(?:https?://)?(?:wa\.me|api\.whatsapp\.com)[^"\'\s<>]*', re.I),
    'email': re.compile(r'mailto:[^"\'\s<>]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', re.I),
    'price': re.compile(r'(?:\$\s?[\d.]+(?:,\d+)?|USD\s?[\d.]+)', re.I),
    'schedule': re.compile(r'\b(?:\d{1,2}:\d{2}\s*(?:a|-)\s*\d{1,2}:\d{2}|\d{1,2}:\d{2})\b'),
    'address': re.compile(r'\b(?:\d{1,4}\s+de\s+Julio\s+\d{1,5}|Concepci[oó]n\s+del\s+Uruguay|Entre\s+R[ií]os)\b', re.I),
}

def extract(path: Path):
    text = path.read_text(encoding='utf-8')
    return {name: sorted(set(pattern.findall(text))) for name, pattern in PATTERNS.items()}

if len(sys.argv) != 3:
    raise SystemExit('usage: check-business-data.py BEFORE AFTER')
before, after = extract(Path(sys.argv[1])), extract(Path(sys.argv[2]))
failed = False
for key in PATTERNS:
    removed = sorted(set(before[key]) - set(after[key]))
    added = sorted(set(after[key]) - set(before[key]))
    print(f'{key}: before={len(before[key])} after={len(after[key])} removed={len(removed)} added={len(added)}')
    if removed or added:
        failed = True
        if removed: print('  removed:', removed)
        if added: print('  added:', added)
if failed:
    raise SystemExit(1)
print('business data: identical')

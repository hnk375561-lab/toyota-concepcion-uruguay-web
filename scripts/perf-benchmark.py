import json
import statistics
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:4173/'
RUNS = 5

def one(page):
    requests = []
    transferred = [0]
    page.on('request', lambda r: requests.append(r.url))
    page.on('response', lambda r: transferred.__setitem__(0, transferred[0] + int(r.headers.get('content-length', '0') or 0)))
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(500)
    metrics = page.evaluate('''() => {
      const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
      const paints = performance.getEntriesByType('paint');
      const cls = performance.getEntriesByType('layout-shift').filter(e => !e.hadRecentInput).reduce((a,e) => a + e.value, 0);
      const long = performance.getEntriesByType('longtask').map(e => e.duration);
      return {lcp: lcp?.startTime || null, fcp: paints.find(e => e.name === 'first-contentful-paint')?.startTime || null,
              cls, longTasks: long, dom: document.querySelectorAll('*').length};
    }''')
    metrics.update({'requests': len(requests), 'contentLength': transferred[0]})
    return metrics

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    samples = [one(page) for _ in range(RUNS)]
    browser.close()

keys = ['lcp', 'fcp', 'cls', 'requests', 'contentLength', 'dom']
summary = {'runs': samples, 'median': {}, 'min': {}, 'max': {}}
for key in keys:
    values = [s[key] for s in samples if s[key] is not None]
    summary['median'][key] = statistics.median(values) if values else None
    summary['min'][key] = min(values) if values else None
    summary['max'][key] = max(values) if values else None
summary['longTasks'] = {'medianCount': statistics.median([len(s['longTasks']) for s in samples]),
                        'maxDuration': max((max(s['longTasks']) if s['longTasks'] else 0) for s in samples)}
output = Path('reports/perf-benchmark-mobile.json')
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary['median'], ensure_ascii=False))

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, coarse in [(390, True), (1280, False)]:
        page = browser.new_page(viewport={'width': width, 'height': 844},
                                has_touch=coarse, is_mobile=coarse,
                                extra_http_headers={'Purpose': 'qa-critical-route'})
        errors = []
        failed = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('requestfailed', lambda request: failed.append(request.url))
        page.goto('http://127.0.0.1:4173/', wait_until='networkidle')
        page.wait_for_timeout(1200)
        result = page.evaluate('''({
          fonts: document.fonts.status,
          localFonts: Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family + ':' + f.weight),
          lenis: !!window.__toyotaLenis,
          lenisLoading: !!window.__toyotaLenisLoading,
          high: Array.from(document.querySelectorAll('[fetchpriority="high"]')).map(e => e.tagName + ':' + (e.getAttribute('as') || e.className || e.id)),
          logo: document.querySelector('.brand-logo')?.currentSrc
        })''')
        print(width, result)
        assert not errors, errors
        assert not failed, failed
        assert result['logo'] and 'asset-bec83be10e47-256.webp' in result['logo'], result
        if coarse:
            assert not result['lenis'], result
        page.close()
    browser.close()

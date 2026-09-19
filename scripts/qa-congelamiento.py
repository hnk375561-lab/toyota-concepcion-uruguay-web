#!/usr/bin/env python3
"""Stress test for image/model interactions with a real mouse and a heartbeat.

Usage: python3 scripts/qa-congelamiento.py --url http://127.0.0.1:4173/ --quick
The full run uses 200 cycles per target; --quick uses 10 cycles per target.
"""
import argparse
import asyncio
import json
import time
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

BROWSERS = ("chromium", "firefox", "webkit")
VIEWPORTS = ((1440, 900), (1920, 1080))

async def heartbeat(page):
    started = time.perf_counter()
    await page.evaluate("1")
    await page.evaluate("""() => new Promise(resolve => requestAnimationFrame(() => resolve(true)))""")
    return round((time.perf_counter() - started) * 1000, 2)

async def snapshot(page):
    return await page.evaluate("""() => ({
      heap: performance.memory?.usedJSHeapSize ?? null,
      nodes: document.getElementsByTagName('*').length,
      listeners: window.getEventListeners ? Object.values(window.getEventListeners(document)).flat().length : null,
      scrollTriggers: window.ScrollTrigger?.getAll().length ?? null,
      timelines: window.gsap?.globalTimeline.getChildren().length ?? null,
      lockCount: window.__toyotaScrollLockCount ?? null,
      lenisStopped: window.__toyotaLenis?.isStopped ?? null,
      overlay: !!document.querySelector('.model-detail.open'),
      runtime: {gsap: !!window.gsap, scrollTrigger: !!window.ScrollTrigger, lenis: !!window.Lenis, toyotaLenis: !!window.__toyotaLenis}
    })""")

async def run_case(p, browser_name, width, height, throttled, url, cycles):
    launcher = getattr(p, browser_name)
    browser = await launcher.launch(headless=True, args=["--disable-dev-shm-usage"] if browser_name == "chromium" else None)
    context = await browser.new_context(viewport={"width": width, "height": height}, reduced_motion="no-preference", has_touch=False, is_mobile=False)
    failures, console_errors, page_errors, blocked = [], [], [], []
    async def route_handler(route):
        target = route.request.url
        if target.startswith(("https://wa.me/", "https://api.whatsapp.com/", "tel:", "mailto:")):
            blocked.append(target)
            await route.abort()
        else:
            await route.continue_()
    await context.route("**/*", route_handler)
    page = await context.new_page()
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(f"{message.type}: {message.text}") if message.type in ("error", "warning") else None)
    if throttled and browser_name == "chromium":
        session = await context.new_cdp_session(page)
        await session.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    await page.goto(url + ("&" if "?" in url else "?") + f"cb={time.time_ns()}", wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(1500)
    targets = page.locator("[data-model-detail], [data-model]")
    target_count = await targets.count()
    rows = [{"click": 0, "heartbeatMs": await heartbeat(page), "metrics": await snapshot(page)}]
    if target_count == 0:
        failures.append("no interactive model/image targets found")
    for cycle in range(cycles):
        target = targets.nth(cycle % max(1, target_count))
        await target.scroll_into_view_if_needed()
        box = await target.bounding_box()
        if not box:
            failures.append(f"cycle {cycle + 1}: target had no bounding box")
            continue
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        await page.mouse.move(x, y)
        await page.mouse.down()
        await page.wait_for_timeout(80)
        await page.mouse.up()
        try:
            elapsed = await heartbeat(page)
            if elapsed >= 1000:
                failures.append(f"cycle {cycle + 1}: heartbeat {elapsed}ms")
        except PlaywrightTimeoutError:
            failures.append(f"cycle {cycle + 1}: heartbeat timeout")
        rows.append({"click": cycle + 1, "heartbeatMs": elapsed if 'elapsed' in locals() else None, "metrics": await snapshot(page)})
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(120)
    reload_started = time.perf_counter()
    try:
        await page.reload(wait_until="domcontentloaded", timeout=5000)
        reload_ms = round((time.perf_counter() - reload_started) * 1000, 2)
    except PlaywrightTimeoutError:
        reload_ms = None
        failures.append("reload timeout")
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(100)
    scroll_before = await page.evaluate("window.scrollY")
    await page.mouse.move(width / 2, height / 2)
    await page.mouse.wheel(0, 700)
    await page.wait_for_timeout(800)
    scroll_after = await page.evaluate("window.scrollY")
    final = await page.evaluate("""() => ({
      scrollChanged: window.scrollY !== 0,
      center: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.className || '',
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      bodyOverflow: getComputedStyle(document.body).overflow,
      bodyPosition: getComputedStyle(document.body).position,
      lenisStopped: window.__toyotaLenis?.isStopped ?? null
    })""")
    if scroll_after == scroll_before:
        failures.append("scroll did not move after stress")
    result = {"browser": browser_name, "viewport": f"{width}x{height}", "throttled4x": throttled, "targets": target_count, "cycles": cycles, "failures": failures, "console": console_errors, "pageErrors": page_errors, "blockedNavigations": blocked, "reloadMs": reload_ms, "final": final, "metrics": rows}
    await browser.close()
    return result

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--quick", action="store_true")
    parser.add_argument("--browsers", nargs="+", default=list(BROWSERS), choices=BROWSERS)
    args = parser.parse_args()
    cycles = 10 if args.quick else 200
    results = []
    async with async_playwright() as p:
        for browser in args.browsers:
            for width, height in VIEWPORTS:
                for throttled in (False, True):
                    if throttled and browser != "chromium":
                        continue
                    results.append(await run_case(p, browser, width, height, throttled, args.url, cycles))
    output = Path("qa-congelamiento-results.json")
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps({"output": str(output), "cases": len(results), "failed": sum(bool(r["failures"]) for r in results)}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())

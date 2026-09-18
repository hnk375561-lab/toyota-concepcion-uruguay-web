import json
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://127.0.0.1:4173/#comparar?a=Hilux&b=SW4%20Diamond", wait_until="networkidle")
    page.wait_for_timeout(700)

    result = {
        "title": page.title(),
        "robots": page.locator('meta[name="robots"]').get_attribute("content"),
        "canonical": page.locator('link[rel="canonical"]').get_attribute("href"),
        "compareA": page.locator("#compareA").input_value(),
        "compareB": page.locator("#compareB").input_value(),
        "compareVisible": page.locator("#compareResult").is_visible(),
        "financing": page.locator("#cuotaResultado").text_content(),
    }

    page.locator('#contactForm button[type="submit"]').click()
    result["contactError"] = page.locator("#contactFormNote").text_content()
    result["contactInvalidName"] = page.locator("#cName").get_attribute("aria-invalid")
    result["contactInvalidMessage"] = page.locator("#cMsg").get_attribute("aria-invalid")

    page.locator("#burger").click()
    result["menuOpen"] = page.locator("#mobilepanel").evaluate("el => el.classList.contains('open')")
    result["scrollLockedAfterMenuOpen"] = page.locator("html").evaluate("el => el.classList.contains('toyota-scroll-locked')")
    page.keyboard.press("Escape")
    result["menuClosedAfterEscape"] = not page.locator("#mobilepanel").evaluate("el => el.classList.contains('open')")
    result["scrollUnlockedAfterMenuClose"] = not page.locator("html").evaluate("el => el.classList.contains('toyota-scroll-locked')")

    page.locator(".model-detail-link").first.click()
    page.wait_for_timeout(100)
    result["modalOpen"] = page.locator("#modelDetail").evaluate("el => el.classList.contains('open')")
    result["scrollLockedAfterModalOpen"] = page.locator("html").evaluate("el => el.classList.contains('toyota-scroll-locked')")
    page.keyboard.press("Escape")
    result["modalClosedAfterEscape"] = not page.locator("#modelDetail").evaluate("el => el.classList.contains('open')")
    result["scrollUnlockedAfterModalClose"] = not page.locator("html").evaluate("el => el.classList.contains('toyota-scroll-locked')")
    result["scrollLockCount"] = page.evaluate("window.__toyotaScrollLockCount")
    result["errors"] = errors
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()

    if (errors or result["compareA"] != "Hilux" or result["compareB"] != "SW4 Diamond" or not result["compareVisible"] or "$ 0" in (result["financing"] or "") or result["contactInvalidName"] != "true" or result["contactInvalidMessage"] != "true" or not result["menuOpen"] or not result["menuClosedAfterEscape"] or not result["modalOpen"] or not result["modalClosedAfterEscape"] or result["scrollLockCount"] != 0):
        sys.exit(1)

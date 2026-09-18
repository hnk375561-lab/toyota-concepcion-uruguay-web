import json
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://127.0.0.1:4173/#gama?filter=suv", wait_until="networkidle")
    page.wait_for_timeout(600)
    result = {
        "filterHash": page.url.split("#", 1)[1],
        "activeFilter": page.locator("#filterbar .filterbtn.active").get_attribute("data-filter"),
        "visibleModels": page.locator("#gama-grid .model:not([hidden])").count(),
        "heroMobileSource": page.locator(".hero-editorial-vehicle picture source[media]").get_attribute("srcset"),
        "heroMobileAssetBytes": None,
        "mobileBarOpacity": page.locator(".mobilebar").evaluate("el => getComputedStyle(el).opacity"),
    }
    for tab in ["0km", "usados", "financiacion", "postventa"]:
        page.locator(f'.faq-tab[data-faq-filter="{tab}"]').click()
        result[f"faq_{tab}_items"] = page.locator("#faqList .faq-item:not([hidden])").count()
    result["disabledIncompleteModels"] = page.locator('#compareA option:disabled').count()
    page.locator("#tradeCar").fill("Toyota Corolla")
    page.locator("#tradeYear").fill("20")
    page.locator("#tradeKm").fill("abc")
    page.locator('#tradeForm button[type="submit"]').click()
    result["tradeError"] = page.locator("#tradeNote").text_content()
    result["tradeInvalid"] = page.locator("#tradeYear").get_attribute("aria-invalid")
    result["errors"] = errors
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
    if errors or result["activeFilter"] != "suv" or result["visibleModels"] < 1 or result["heroMobileSource"] != "toyota-sharp-assets/hero-sw4-480.webp" or result["tradeInvalid"] != "true" or result["disabledIncompleteModels"] < 2 or any(result[f"faq_{tab}_items"] < 1 for tab in ["0km", "usados", "financiacion", "postventa"]):
        sys.exit(1)

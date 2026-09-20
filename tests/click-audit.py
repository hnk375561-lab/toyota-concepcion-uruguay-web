#!/usr/bin/env python3
"""Auditoría determinista del sitio Toyota Concepción del Uruguay.

Uso: python3 tests/click-audit.py
BASE_URL puede apuntar a otra URL de preview o Pages.
"""
from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from playwright.sync_api import Browser, Page, sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8000/")
CASES = [
    ("desktop-lenis", 1440, 900, False),
    ("desktop-reduced", 1440, 900, True),
    ("tablet-touch", 820, 1180, True),
    ("mobile-touch", 390, 844, True),
]
EXPECTED_FILTER_COUNTS = {"todos": 9, "pickup": 1, "suv": 5, "sedan": 3}


@dataclass
class Result:
    name: str
    passed: bool
    detail: str


@dataclass
class Audit:
    results: list[Result] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def check(self, name: str, condition: bool, detail: str) -> None:
        self.results.append(Result(name, bool(condition), detail))
        if not condition:
            self.errors.append(f"{name}: {detail}")


def visible(locator) -> bool:
    """Visibilidad por layout; no usa el atributo hidden."""
    return bool(locator.evaluate("""el => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0;
    }"""))


def visible_count(page: Page, selector: str) -> int:
    return int(page.locator(selector).evaluate_all("""els => els.filter(el => {
      const cs=getComputedStyle(el), r=el.getBoundingClientRect();
      return cs.display!=='none' && cs.visibility!=='hidden' && r.height>0;
    }).length"""))


def new_page(browser: Browser, width: int, height: int, reduced: bool) -> tuple[Page, list[str], list[str]]:
    context = browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce" if reduced else "no-preference",
        is_mobile=width <= 820,
        has_touch=width <= 820,
    )
    page = context.new_page()
    console_errors: list[str] = []
    failed: list[str] = []
    page.on("pageerror", lambda exc: console_errors.append(f"pageerror: {exc}"))
    page.on("console", lambda msg: console_errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.on("requestfailed", lambda req: failed.append(f"{req.method} {req.url}: {req.failure}") if "google.com/maps" not in req.url else None)
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(1800)
    return page, console_errors, failed


def anchor_audit(page: Page, audit: Audit, case_name: str) -> None:
    hrefs = page.locator('a[href^="#"]').evaluate_all("els => els.map(a => ({href:a.getAttribute('href'), text:(a.textContent||'').replace(/\\s+/g,' ').trim()}))")
    audit.check(f"{case_name}/anchors-found", len(hrefs) >= 90, f"{len(hrefs)} anchors internos encontrados")
    for idx, item in enumerate(hrefs):
        href, text = item["href"], item["text"]
        key = href[1:].split("?")[0]
        if not key or key == "top" or key.startswith("modelo/"):
            continue
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(350)
        target = page.locator(f"#{key}").first
        if target.count() == 0:
            audit.check(f"{case_name}/anchor-{idx}", False, f"{text!r} apunta a {href} sin destino")
            continue
        page.evaluate("window.scrollTo(0,0)")
        try:
            candidates = page.locator('a[href="' + href.replace('"', '\\"') + '"]').all()
            link = next((candidate for candidate in candidates if visible(candidate)), candidates[0] if candidates else None)
            if link is None:
                raise RuntimeError("no se encontró anchor para el href")
            link.click(force=True, timeout=4000)
            page.wait_for_timeout(120)
        except Exception as exc:
            audit.check(f"{case_name}/anchor-{idx}", False, f"click falló: {text!r} → {href}: {exc}")
            continue
        is_visible = visible(target)
        header_h = page.locator("#site-header").evaluate("el => el.offsetHeight")
        heading_top = target.locator("h2,h3").first.evaluate("el => el.getBoundingClientRect().top") if target.locator("h2,h3").count() else target.evaluate("el => el.getBoundingClientRect().top")
        active_tab_ok = True
        ancestor_panel = target.locator("xpath=ancestor::*[@role='tabpanel'][1]")
        if ancestor_panel.count():
            active_tab_ok = ancestor_panel.get_attribute("hidden") is None and visible(ancestor_panel)
        audit.check(f"{case_name}/anchor-{idx}", is_visible and heading_top >= header_h - 2 and active_tab_ok,
                    f"{text!r} → {href}; visible={is_visible}, heading_top={round(heading_top)}, header={header_h}, tab={active_tab_ok}")


def filter_audit(page: Page, audit: Audit, case_name: str) -> None:
    for key, expected in EXPECTED_FILTER_COUNTS.items():
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1200)
        page.locator(f'#filterbar .filterbtn[data-filter="{key}"]').click()
        page.wait_for_timeout(120)
        count = visible_count(page, "#gama-grid .model")
        empty_visible = visible(page.locator("#filterEmpty"))
        audit.check(f"{case_name}/gama-{key}", count == expected and not empty_visible, f"visible={count}, expected={expected}, empty={empty_visible}")
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    for button in page.locator("#faqList").locator("xpath=preceding-sibling::*[@role='tablist'][1]").locator("[role=tab]").all():
        button.click()
        page.wait_for_timeout(80)
        count = visible_count(page, "#faqList .faq-item")
        audit.check(f"{case_name}/faq-{button.text_content().strip()}", count > 0, f"visible={count}")
    page.locator("#tab-accesorios").click()
    page.wait_for_timeout(120)
    for button in page.locator(".access-filter").all():
        button.click()
        page.wait_for_timeout(80)
        count = visible_count(page, "#accesorios .access-grid figure")
        audit.check(f"{case_name}/accessories-{button.text_content().strip()}", count > 0, f"visible={count}")


def compare_audit(page: Page, audit: Audit, case_name: str) -> None:
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(1200)
    page.locator('#filterbar .filterbtn[data-filter="todos"]').click()
    page.wait_for_timeout(120)
    page.locator('[data-compare-model="Hilux"]').click()
    page.wait_for_timeout(250)
    a, b = page.locator("#compareA"), page.locator("#compareB")
    audit.check(f"{case_name}/compare-first", a.input_value() == "Hilux" and b.input_value() == "" and page.locator("#compareDisclosureButton").get_attribute("aria-expanded") == "true", f"A={a.input_value()}, B={b.input_value()}")
    page.locator('[data-compare-model="SW4 Diamond"]').click()
    page.wait_for_timeout(250)
    audit.check(f"{case_name}/compare-second", a.input_value() == "Hilux" and b.input_value() == "SW4 Diamond" and visible(page.locator("#compareResult")), f"A={a.input_value()}, B={b.input_value()}, result={visible(page.locator('#compareResult'))}")
    page.locator('[data-compare-model="Corolla Cross"]').click()
    page.wait_for_timeout(250)
    audit.check(f"{case_name}/compare-replace-b", a.input_value() == "Hilux" and b.input_value() == "Corolla Cross" and a.input_value() != b.input_value(), f"A={a.input_value()}, B={b.input_value()}")


def external_audit(page: Page, audit: Audit, case_name: str) -> None:
    links = page.locator('a[href^="https://wa.me"],a[href^="tel:"],a[href^="mailto:"],a[href*="google.com/maps"],a[href*="maps.google"]')
    bad: list[str] = []
    for link in links.all():
        href = link.get_attribute("href") or ""
        text = (link.text_content() or "").strip()
        if href.startswith("https://wa.me"):
            phone = urlparse(href).path.lstrip("/")
            if phone not in {"5493442473453", "5493442677433", "5493442502390"}:
                bad.append(f"WA {text!r} {phone}")
            if "text=" not in href:
                bad.append(f"WA sin mensaje {text!r}")
        elif href.startswith("tel:") and not re.search(r"\+543442(?:473453|677433|502390)", href):
            bad.append(f"tel {text!r} {href}")
    audit.check(f"{case_name}/external-links", not bad, "; ".join(bad) if bad else "números y mensajes dentro de los canales publicados")


def form_audit(page: Page, audit: Audit, case_name: str) -> None:
    for form_id in ("contactForm", "tradeForm"):
        form = page.locator(f"#{form_id}")
        if form.count() == 0:
            audit.check(f"{case_name}/{form_id}", False, "formulario no encontrado")
            continue
        invalid_empty = bool(form.evaluate("form => !form.checkValidity()"))
        audit.check(f"{case_name}/{form_id}-validation", invalid_empty, "el formulario vacío bloquea el envío")
    preview = page.locator("#messagePreview")
    audit.check(f"{case_name}/contact-message-preview", preview.count() > 0 and visible(preview) and bool(preview.text_content().strip()), "preview visible y no vacío")


def overflow_audit(page: Page, audit: Audit, case_name: str) -> None:
    metrics = page.evaluate("""() => ({body:document.body.scrollWidth, html:document.documentElement.scrollWidth, viewport:window.innerWidth})""")
    audit.check(f"{case_name}/horizontal-overflow", metrics["body"] <= metrics["viewport"] and metrics["html"] <= metrics["viewport"], str(metrics))


def run() -> int:
    audit = Audit()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for case_name, width, height, reduced in CASES:
            page, console_errors, failed = new_page(browser, width, height, reduced)
            anchor_audit(page, audit, case_name)
            filter_audit(page, audit, case_name)
            compare_audit(page, audit, case_name)
            external_audit(page, audit, case_name)
            form_audit(page, audit, case_name)
            overflow_audit(page, audit, case_name)
            audit.check(f"{case_name}/page-errors", not console_errors, "; ".join(console_errors[:3]) or "0 pageerror/console.error")
            audit.check(f"{case_name}/failed-requests", not failed, "; ".join(failed[:3]) or "0 requests failed")
            page.context.close()
        browser.close()
    print("| Caso | Estado | Detalle |")
    print("|---|---|---|")
    for result in audit.results:
        print(f"| {result.name} | {'PASS' if result.passed else 'FAIL'} | {result.detail.replace('|', '\\|')} |")
    print(f"\nResumen: {sum(r.passed for r in audit.results)}/{len(audit.results)} PASS")
    return 0 if not audit.errors else 1


if __name__ == "__main__":
    raise SystemExit(run())

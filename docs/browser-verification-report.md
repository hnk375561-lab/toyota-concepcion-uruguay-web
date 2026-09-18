# Real browser verification report

## Method

The current build was served from `127.0.0.1:4173` and the original commit `6322bb4` from `127.0.0.1:4174`. A headless Chromium crawl used Playwright at 1440×900, 820×900 and 390×844, with reduced motion enabled. Each viewport loaded the page, exercised available filters/modal/gallery/menu controls, and scrolled the full document so lazy images were requested. The raw trace is stored in `docs/browser-crawl.json`.

Lighthouse 12.8.2 then ran against both builds with the same local Chromium and its default simulated performance profile, once in desktop mode and once in mobile mode. Values below are direct outputs from the saved Lighthouse JSON files; the LCP element selector was not exposed in this Lighthouse run, so no element name is claimed.

## Crawl results

| Build | Viewport | Requests | Images requested | First-load image bytes | Full-scroll image bytes | HTTP failures | Page errors | Console warnings/errors |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| After | Desktop | 65 | 57 | 734,700 B | 4,852,268 B | 0 | 0 | 0 |
| After | Tablet | 65 | 57 | 594,644 B | 4,852,268 B | 0 | 0 | 0 |
| After | Mobile | 65 | 57 | 198,084 B | 4,455,708 B | 0 | 0 | 0 |
| Original | Desktop | 61 | 53 | 1,080,122 B | 12,947,512 B | 0 | 0 | 0 |
| Original | Tablet | 61 | 53 | 594,644 B | 12,947,512 B | 0 | 0 | 0 |
| Original | Mobile | 61 | 53 | 198,084 B | 12,550,952 B | 0 | 0 | 0 |

The crawl itself therefore measured a full-scroll reduction of **62.5% desktop**, **62.6% tablet**, and **64.5% mobile**. First-load image bytes fell **32.0% desktop**, were unchanged at tablet width, and were unchanged at mobile width under this local-server run because the same hero/mobile requests were selected.

## Lighthouse before/after

| Profile | Metric | Original | After | Delta |
|---|---|---:|---:|---:|
| Desktop | LCP | 8,628.7 ms | 7,502.4 ms | **−1,126.3 ms** |
| Desktop | CLS | 0.050914 | 0.050938 | +0.000024 |
| Desktop | TBT | 375 ms | 329 ms | **−46 ms** |
| Mobile | LCP | 4,025.9 ms | 3,981.1 ms | **−44.8 ms** |
| Mobile | CLS | 0.070646 | 0.070646 | 0 |
| Mobile | TBT | 1,382.4 ms | 1,228.3 ms | **−154.1 ms** |

The desktop CLS value is microscopically higher in this single Lighthouse run. The crawl verified zero layout-shift entries in its own instrumentation, and all dynamic images retain explicit dimensions. No additional layout change was introduced to chase a difference of 0.000024; this remains flagged for repeat sampling on the deployed host.

## Files, size and orphans

The deployed payload (`index.html` plus `toyota-sharp-assets`) measured **55,367,100 bytes** in the original worktree and **29,588,929 bytes** after the image cleanup and responsive variants. Documentation and the contact sheet are outside that payload. The reversible external backup still contains the 84 moved files.

The browser requested **90 unique image filenames** across all six crawl passes. There are **219 image files** in the current asset directory, so 129 were not selected in these exact viewport passes. Of those, **88 have no literal filename reference** because they are generated variants or source candidates; the other 41 are referenced by code/manifests but were not selected by Chromium. They were **not removed**: the dynamic `srcset`/catalog paths and manifest paths make deletion unsafe without a production traffic trace. The full literal-unreferenced list is in `docs/orphans-literal.txt`.

## Ten heaviest served files

| Original served file | Original bytes | After served file | After bytes |
|---|---:|---|---:|
| `enhanced-371d49eb8a93.webp` | 1,173,770 | `hero-sw4-1800.webp` | 440,844 |
| `enhanced-4533c3b60b75.webp` | 1,071,448 | `enhanced-10b9781f8b0e-800.webp` | 227,206 |
| `enhanced-9608f3af165f.webp` | 676,476 | `enhanced-9608f3af165f-800.webp` | 204,304 |
| `enhanced-4a00d0bf85e9.webp` | 579,336 | `enhanced-94978cf308df-800.webp` | 185,716 |
| `enhanced-bae67c9e04b0.webp` | 485,478 | `enhanced-4533c3b60b75-800.avif` | 165,940 |
| `enhanced-3545495d2aea.webp` | 463,966 | `enhanced-bae67c9e04b0-800.webp` | 140,056 |
| `enhanced-e0f705dd52d1.webp` | 451,062 | `enhanced-3545495d2aea-800.webp` | 138,020 |
| `enhanced-db467678d4f8.webp` | 446,898 | `enhanced-e0f705dd52d1-800.webp` | 136,980 |
| `hero-sw4-1800.webp` | 440,844 | `enhanced-db467678d4f8-800.webp` | 135,622 |
| `enhanced-10b9781f8b0e.webp` | 436,892 | `enhanced-580a84256aa0-800.webp` | 128,656 |

The hero remained the largest desktop request and was not re-encoded. Chromium selected the mobile hero WebP in the mobile crawl at 44,284 bytes; no dedicated 4:5 mobile crop exists yet, so that photography improvement remains open.

## Grade decision and visual evidence

A 57-photo contact sheet was generated from every image actually requested in the desktop after-crawl. It shows the current pixels beside a deterministic contrast **1.06** / color **0.97** candidate. The review sheet is [available here](grade-contact-sheet.png), with an HTML version at [grade-contact-sheet/index.html](grade-contact-sheet/index.html).

The grade was **not applied**. The contact sheet shows that the proposed grade is subtle but not clearly better across the mixed set of logos, signage, catalog vehicles, product imagery and facilities photos; applying it globally would therefore be blind processing. No images were excluded from production because no graded file was promoted. The existing repeatable pipeline remains available for a future photography-only selection review.

## Remaining limits and verdict

This closes the real-browser crawl, before/after byte measurement, Lighthouse LCP/CLS/TBT comparison, responsive format verification, zero-404 verification, and visual grade review. The measured data supports keeping the current image-size cleanup: LCP and TBT improved, full-scroll image bytes dropped substantially, and no crawl request or console failure was observed.

Still unmeasurable here are production CDN transfer behavior, real-user LCP, and a reliable LCP element name from this Lighthouse output. A deployed-host repeat should also sample CLS more than once because of the tiny desktop delta. New photography is still required to close the SW4 hero, Hilux and facilities quality gap; another blanket image-processing pass is **not** worth applying. A targeted pass becomes worthwhile only after selecting replacement photos and reviewing their slot-specific contact sheet.

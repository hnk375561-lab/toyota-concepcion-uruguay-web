# Image cleanup report

## Reference map

The scan covered HTML, CSS, JavaScript, JSON, Markdown, XML and text files, including dynamic catalog/gallery path construction and manifests. The initial inventory contained **173 image files**: **89 USED**, **84 UNUSED**, and **0 UNCERTAIN** under the conservative rules used by `scripts/reference-map.py`. The UNUSED set consisted of JPEG originals with a corresponding WebP or generated duplicate; each was moved, never deleted, to **un directorio de respaldo fuera del repositorio**.

Dynamic model paths were resolved by inspecting the catalog renderer and by validating every generated 480/800 path. `scripts/validate-assets.py` reports 90 static local paths and 0 missing paths, and Pillow successfully decodes all retained image files.

## Build result

| Metric | Before | After | Notes |
|---|---:|---:|---|
| Image files | 173 | 229 | New 480/800 AVIF/WebP variants are included for active enhanced/model images. |
| Build size | 55.3 MB (audit baseline) | ~30 MB | Measured with `du -sh --exclude=.git`; excludes the external backup. |
| Confirmed unused originals | 0 moved | 84 moved | Backup is outside the build and reversible. |
| First-load downloaded bytes, desktop/mobile | Not measured in the supplied baseline | Not claimed | Requires a browser network trace against the deployed URL; file-size reduction is measurable, but transfer totals depend on viewport/cache/CDN. |
| LCP | Not measured in the supplied baseline | Not claimed | Hero was not re-encoded; no invented performance number. |

## The two known offenders

| Image | Before | Active after | Change |
|---|---:|---:|---|
| `enhanced-371d49eb8a93.webp` | 3124×3200, 1,173,770 bytes | 800×819 WebP 136,288 bytes; 800 AVIF 69,557 bytes; 480 AVIF 28,645 bytes | Cards now use responsive 480/800 AVIF-first markup. |
| `enhanced-4533c3b60b75.webp` | 1594×1600, 1,071,448 bytes | 800×803 WebP 315,658 bytes; 800 AVIF 165,940 bytes | Static facilities image now uses the 800 AVIF/WebP pair. |

The original hero was not recompressed. Its removed JPEG fallback was replaced by the existing WebP because the hero is already served from the retained WebP asset; its preload, priority and crop behavior were left intact.

## Grade and pipeline

The repeatable pipeline uses contrast **1.06** and color saturation **0.97**, with no upscaling and a centered slot crop. Existing kept photos were not batch-regraded because that would alter the established visual baseline without a before/after visual review. The pipeline is ready for replacement photography at `scripts/process-photos.py`; AVIF is retained only when smaller than equal-size WebP.

The slot specification is in `docs/photo-slots.md`. The one-page replacement brief for the SW4 hero, main Hilux and showroom/facilities is in `docs/photo-replacement-brief.md`.

## Validation and verdict

`python3 scripts/validate-assets.py` passes with 0 missing local paths and all retained images decoding. The generated model cards and highlights retain explicit dimensions, lazy loading and async decoding; the hero retains non-lazy/high-priority behavior. Motion, tokens, type scale, spacing, layout and copy were not intentionally changed.

This closes confirmed duplicate/original cleanup, responsive active-image sizing, AVIF/WebP delivery for active cards, reversible backup, reference mapping, and replacement-ready documentation. It does **not** close the need for new photography, nor does it claim measured LCP or network-transfer improvements without a deployed browser trace. A browser pass should be run against the published site to record desktop/mobile first-load bytes, LCP, console errors, 404s, reduced-motion behavior, pins and parallax.

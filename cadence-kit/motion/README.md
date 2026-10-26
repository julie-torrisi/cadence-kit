# Cadence motion runtime

Motion, sound and haptics for every Cadence page, slide and cover letter, modeled on how Apple uses motion on its product pages and in its Human Interface Guidelines. The full rules live in Julie Stack (`claude/motion-sound-haptics.md`). This folder is the code that enforces them.

Every value comes from `--ck-motion-*`, `--ck-alias-*` and `--ck-component-*` tokens in `dist/css/cadence-kit.css`. There are no raw durations, curves or colors in these files.

## Load it

```html
<link rel="stylesheet" href="dist/css/cadence-kit.css">
<link rel="stylesheet" href="motion/cadence-motion.css">
<script src="motion/cadence-motion.js" defer></script>
```

Load `cadence-kit.css` first. The runtime has no dependencies and works with no build step.

## What you get

| Need | Markup / call | Rule |
|---|---|---|
| Reveal on scroll (once) | `data-reveal`, stagger with `style="--i:1"` | `duration.standard`, `easing.enter`, travels `distance.enter` |
| Act opener | `data-reveal="cinematic"` | `duration.cinematic` (800ms), one per act |
| Press feedback | `data-press` | `duration.instant` on pointer-down |
| Slide or step change | `CadenceMotion.step(nextEl, prevEl)` | enter `standard`, exit `quick`; a new input finishes the running one |
| Sticky scroll scene | `data-scene` > `data-scene-stage` > `canvas[data-frames][data-frame-count][data-poster]` | `scroll.scene` (300vh); poster on slow connections and reduced motion |
| Ambient loop | `data-ambient`, pause button `data-motion-toggle` | `duration.ambient` (24s); pauses offscreen |
| Pagination (10/26) | `CadencePager(host, { items, start, mode: 'inline' \| 'rail', loop, acts, noun, onGo })` from `cadence-pager.css` + `cadence-pager.js` | squares of dots on an unlit dot board (the dot-visual donut look): `component.pager.*`, dusk ahead, lilac passed, blue current; the current square slides on transform; rail = one square per page, act names on hover/focus, a bar under 760px |
| Pagination, legacy | `CadenceMotion.pager(...)` | the 10/23 pill pager; superseded by `CadencePager`, kept until the cover letter pages move over |
| Video loop | `<video data-loop muted loop playsinline poster="…">` | visible pause, pauses offscreen, poster under reduced motion |
| Loader | `<span class="cm-loader"><i></i><i></i><i></i></span>` | dot-matrix dots, one lit at a time, each holds `duration.standard` |
| Long-wait loader | `<span class="cm-loader-scan"></span>` | 9 × 3 matrix, a lit column sweeps across |
| Carousel | `.cm-carousel-items` with `.is-active` on one child; `CadenceMotion.carousel(itemsEl)(n, dir)` from a pager's `onChange` | top-aligned shared box; enters sideways in the paging direction, exits by fading |
| Chapter numeral | `<div data-numeral="2"></div>` inside its chapter section | 5 × 9 cells fill as the section scrolls from 40% to 85%; `duration.standard`, `easing.enter` |
| Metric number | `<span class="cm-pxnum" data-pxnum>78%</span>` | glyphs build in `steps(6)`, `stagger` apart, once at 60% visible |
| Pixel accent word | `<span class="cm-pixel">earns</span>` | `brand.font.family.pixel` (Redaction 50), upright |
| Centered label | `.cm-label-center` on pills and buttons | cap-height trim where supported |
| Toast | `CadenceMotion.toast("Draft saved")` | in/out `quick`, holds `duration.hold` (4s) |
| Copy confirm | `CadenceMotion.copied(button, text)` | "Copied" for half of `duration.hold` (2s) |

## Reduced motion

The OS setting (`prefers-reduced-motion: reduce`) or `<html data-motion="reduce">` turns every movement into a fade (`duration.reduced`, 150ms). Scroll scenes show their poster, ambient loops and videos stop, autoplay turns off. Nothing is hidden.

## Sound and haptics

None on the web. The runtime never plays a sound or calls `navigator.vibrate`. Native builds use `haptic.*` and `sound.*` from `tokens/motion/motion-haptics.json`.

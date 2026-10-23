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
| Pagination | `CadenceMotion.pager(host, { count, labels, noun, orientation, autoplay, onChange })` | `component.pager.*`; autoplay holds `duration.dwell` (6s) with a visible pause |
| Video loop | `<video data-loop muted loop playsinline poster="…">` | visible pause, pauses offscreen, poster under reduced motion |
| Loader | `<span class="cm-loader"><i></i><i></i><i></i></span>` | steps by `stagger` |
| Toast | `CadenceMotion.toast("Draft saved")` | in/out `quick`, holds `duration.hold` (4s) |
| Copy confirm | `CadenceMotion.copied(button, text)` | "Copied" for half of `duration.hold` (2s) |

## Reduced motion

The OS setting (`prefers-reduced-motion: reduce`) or `<html data-motion="reduce">` turns every movement into a fade (`duration.reduced`, 150ms). Scroll scenes show their poster, ambient loops and videos stop, autoplay turns off. Nothing is hidden.

## Sound and haptics

None on the web. The runtime never plays a sound or calls `navigator.vibrate`. Native builds use `haptic.*` and `sound.*` from `tokens/motion/motion-haptics.json`.

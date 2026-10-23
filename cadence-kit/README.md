# Cadence Kit

Design tokens for **Cadence Kit**, the dot-matrix communications kit behind [Cadence](https://github.com/julie-torrisi/cadence-site), a Figma plugin that teaches AI your design system.

The kit covers the surfaces a brand uses to talk to its users (push, banner, toast, modal, hero, input, button) across **Web, iOS and Android**, in **light and dark**. These tokens are the variables that drive the Figma file, exported to the [W3C Design Tokens (DTCG)](https://www.designtokens.org/) format, plus ready-to-use CSS and resolved JSON.

## What's inside

```
tokens/                 Source of truth, DTCG JSON, one file per Figma collection + mode
  primitives/scale.json      Scaling: the global dimension sequence (0, 1, 2, 4, 8 … 80)
  brand/cadence.json         Brands: Cadence palette, role colors, type, shape
  brand/sample.json          Brands: a second brand to show the system re-skins
  platform/web|ios|android   Platform: type scale, spacing, grid, touch targets, text pairings
  theme/light|dark.json      Modes: light/dark color mapping, plus asset.* placeholder slots (illustration, photography, motion)
  semantic/alias.json        Alias: the consumption layer — use these in product code
  component/components.json  Components: push, banner, modal, toast, button, input, loader, icon
  motion/motion-haptics.json Motion & Haptics: durations, easing, reduce-motion, haptic mapping
  typography/text-styles.json  Text styles and cap-trimmed text pairings
dist/
  css/cadence-kit.css        CSS custom properties + text style classes
  json/<brand>-<platform>-<theme>.json   12 flat files, every token fully resolved
motion/
  cadence-motion.css/.js     Motion runtime: reveals, steps, scroll scenes, pager, video loops, toast (see motion/README.md)
scripts/build.mjs       Rebuilds dist/ from tokens/ (no dependencies)
```

## How the layers stack

Each layer only references the one below it, so swapping a brand, platform or theme re-skins everything above it.

```
Components   component.button.primary.background
   ↓
Alias        alias.color.primary.interaction        ← use these in product code
   ↓
Modes        mode.primary.interaction   (Light | Dark)
Platform     space.md, target.min       (Web | iOS | Android)
   ↓
Brands       brand.color.role.main.primary.strong  (Cadence | Sample brand)
   ↓
Primitives   brand.color.palette.blue.500, scale.2xs
```

| Axis | Modes | What changes |
|---|---|---|
| Brand | Cadence, Sample brand | Palette, role colors, font families, corner radii |
| Platform | Web, iOS, Android | Body size (16 / 17 / 16), min target (44 / 44 / 48), grid columns, screen width, padding |
| Theme | Light, Dark | Every surface, text, border, state and icon color |

## Use it

### CSS

```html
<link rel="stylesheet" href="dist/css/cadence-kit.css">

<html data-theme="dark" data-platform="ios" data-brand="sample">
```

Defaults are Cadence · Web · Light, and dark follows `prefers-color-scheme` unless you set `data-theme`. Every token is a custom property prefixed `--ck-`:

```css
.cta {
  height: var(--ck-component-button-height);
  padding-inline: var(--ck-component-button-paddingX);
  border-radius: var(--ck-component-button-radius);
  background: var(--ck-component-button-primary-background);
  color: var(--ck-component-button-primary-text);
  transition: background var(--ck-motion-duration-quick) var(--ck-motion-easing-standard);
}
```

Text styles ship as classes: `.ck-font-headline-1`, `.ck-font-body-long`, `.ck-pairing-level4-headline-emphasized`, `.ck-font-display-1` and so on.

### JSON

Pick the combination you need from `dist/json/`, e.g. `cadence-android-dark.json`:

```json
{
  "component.button.primary.background": "#3a6fcb",
  "component.button.height": "48px",
  "typescale.fontSize.body.short": "16px"
}
```

### Token tools

The files in `tokens/` follow the DTCG 2025.10 format (colors as sRGB objects with a `hex` fallback, dimensions as `{ value, unit }`), so they work with Style Dictionary and other DTCG-aware tools. Figma variable scopes are kept under `$extensions["com.figma"]`.

## Rebuild

```bash
npm run build     # or: node scripts/build.mjs
```

The build fails on any broken or circular reference.

## Type

| Role | Face | License |
|---|---|---|
| Display | [Doto](https://fonts.google.com/specimen/Doto) Bold | SIL Open Font License |
| Serif statements, title kickers | [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) | SIL Open Font License |
| Headlines, body | [Inter](https://fonts.google.com/specimen/Inter) | SIL Open Font License |
| Status, code | [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) | SIL Open Font License |
| Slides (pixel serif) | [Redaction](https://github.com/jeremymickel/Redaction), all 7 families | SIL Open Font License, bundled in `fonts/redaction/` |

Doto, Instrument Serif, Inter and Geist Mono are not bundled; load them from Google Fonts or your own host. Redaction isn't on Google Fonts, so it ships here.

### Redaction

Seven families: `Redaction` is the clean drawing; `Redaction 10` through `Redaction 100` are optical sizes drawn through progressively degraded, bitmap-like forms. Each has Regular, Italic and Bold.

**On the web:** load `dist/css/fonts.css` next to the token CSS, then use the family name.

```html
<link rel="stylesheet" href="dist/css/fonts.css">
<link rel="stylesheet" href="dist/css/cadence-kit.css">
```

**In Figma (Mac):** Figma only sees fonts installed on your computer. Run this once in Terminal, then quit Figma (Cmd+Q) and reopen it:

```sh
curl -fsSL https://raw.githubusercontent.com/julie-torrisi/cadence-kit/main/cadence-kit/scripts/install-fonts-mac.sh | sh
```

Or install by hand: double-click each `.otf` in `fonts/redaction/otf/` and choose **Install**.

### Serif patterns

`--ck-brand-font-family-serif` drives two patterns that sit beside the dot type.

**Title kicker.** The short line above a title: a dot `>` arrow (drawn on the dot grid, so it never moves) followed by a serif label in the subtle text color. The label is nudged up so the arrow's point meets the middle of its capital letters: 4.5px on desktop, 5.5px under 1024px, 0 under 640px.

```css
.kick{display:flex;align-items:flex-start;gap:calc(var(--p)*3);font-family:var(--ck-brand-font-family-serif);font-size:calc(var(--p)*9);line-height:1.1}
.kick{--kick-lift:4.5px}
@media (max-width:1023px){.kick{--kick-lift:5.5px}}
@media (max-width:639px){.kick{--kick-lift:0px}}
.kick>span:last-child{position:relative;top:calc(var(--kick-lift)*-1)}
```

**Pixel-serif emphasis.** In a serif statement, one or two key words are drawn at 30 cells per em and scaled up with hard edges, in the primary interaction color. Use it at display sizes only: at body size the pixels break letters apart and the copy stops being readable. Keep the real text in the page for screen readers.

Section numbers in a title kicker (`01 · …`) always use pixel-serif emphasis in the primary interaction color. The rest of the label stays smooth.

**Proof label.** The small label above the evidence line in a step or card. Doto ExtraBold, 13px, uppercase, 0.78px tracking, in the subtle text color, sitting 4px above the proof copy. Token: `textStyle.font.label.proof`.

```css
.step .proof .k{display:block;margin-bottom:4px;font-family:Doto,monospace;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--grey)}
```

## Haptics

Motion on the page comes from the runtime in [`motion/`](motion/README.md), which reads only these tokens.

Haptic guidance lives in `tokens/motion/motion-haptics.json` and the resolved JSON (it isn't CSS). Errors map to `UINotificationFeedbackGenerator .error` on iOS and `HapticFeedbackConstants.REJECT` on Android, success to `.success` / `CONFIRM`, presses to `UIImpactFeedbackGenerator .light` / `CLICK`. Status, activity, tips, announcements and all web surfaces use no haptics, and push haptics are left to the OS.

## Credits

Token architecture adapted from the **SCALES Design Tokens Starter Set** (MIT). See [NOTICE](NOTICE).

## License

[MIT](LICENSE) © 2026 Julie Torrisi-Coffey

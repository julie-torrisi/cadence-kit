# Cadence Kit MVP: SPEC

Version: draft 1 · Mon 11/16 · Owner: Julie (design owner, taste and approval) · Builder: Claude (build, check, log)
Status: DRAFT, needs Julie's go. All Prompt 2 blockers decided (section 13). Decisions referenced by letter live in claude/decisions.md.

---

## 1. What we're building

An AI-ready design system that agents and humans read the same way. JTC Dot is the reference brand (decision b), in Dark and Light (decision c). One master Figma library, "JTC Dot Master Design Kit" (decision d), owned and edited by Julie. It is the engine under the Cadence Figma plugin and connects to other teams' systems through one contract.

MVP ships Fri 11/20: Foundations + Forms + Actions + Feedback masters, Contract v1, a checker in CI, the Cadence site on the kit, and the Design + AI page with a shipped log and a dashboard section.

## 2. Goals and how each one is proven

| # | Goal | Proven by (metric in claude/metrics.md) |
|---|---|---|
| 1 | Agents build faster, on spec, accessible by default | Metrics 3, 4, 9, 11 |
| 2 | Engine under the Cadence plugin | Phase 4: plugin reads the contract |
| 3 | Works with other teams' systems through one contract | Phase 4: GitHub Primer test (decision i) |
| 4 | One source of truth for agents | Metrics 6, 7, 8 |
| 5 | Design + AI page proves it | Metrics 1, 2; shipped log + dashboard live |

## 3. Out of scope for MVP (Fri 11/20)

Navigation, Data display, Find group, Dot visuals, Dot chrome, extras, templates (Phase 2). Code Connect, Claude skill starter, MCP server, which means the Model Context Protocol server (Phase 3). Primer test, with/without eval, plugin reading the contract (Phase 4). Phase order is in claude/phased-plan.md.

## 4. Source of truth (three layers, always in sync)

```
cadence-kit repo (tokens, DTCG format, meaning the W3C Design Tokens Community Group JSON)
   │  build: scripts/build.mjs        sync direction is one way (decision e)
   ▼
Figma variables in "JTC Dot Master Design Kit" (Dark and Light modes)
   │  masters bind every fill, stroke, text, radius and spacing to variables
   ▼
Code components: web components + CSS custom properties generated from tokens (decision f)
   linked to masters with Code Connect (Phase 3)
```

- Hex values live in exactly one file: tokens/brand/jtc-dot.json (gap A1 proposed).
- A Figma edit to a variable comes back as a token change in the repo, then re-syncs. Figma is never the source.
- If this Project's docs and the repo disagree, flag it, don't pick one.

## 5. Token architecture

JTC Dot becomes a third brand in the existing layer stack, not a fork. It fills the slots that already exist in tokens/theme/*.json, so the contract stays the same shape for every brand.

| Layer | File | JTC Dot work |
|---|---|---|
| Primitives | primitives/scale.json | No change |
| Brand | brand/jtc-dot.json (new) | New palette (decision x), font families (decision y), radius 0 + radius.pill (gap A6) |
| Platform | platform/web, ios, android | Sizes sm 32, md 44, lg 52 (decision w); breakpoints (gap A8) |
| Theme | theme/dark.json, theme/light.json | Fill existing slots for the JTC Dot brand (see below) |
| Alias | semantic/alias.json | border.control (decision aa); placeholder (gap C2) |
| Component | component/components.json | Control sizes, gaps, scrim rebinding (gap A7) |
| Motion | motion/motion-haptics.json | JTC Dot motion set moved in, names mapped 1:1 (gap A4) |

Existing theme slots JTC Dot fills (checked: read from tokens/theme/dark.json on 11/16):
- Intent: mode.intent.{info, success, warning, critical}{HighEmphasis, LowEmphasis} + on{Intent} (gap B1, decision z)
- State: mode.state.{hover, press, select, onSelect, selectInverted, onSelectInverted, disable, onDisable} (gap B4)
- Border: mode.border.{subtle, medium, heavy, focusOutline} (gap C1)
- Overlay: mode.background.overlay (the scrim, gap A7)

Rules:
- Accent (coral today, pending palette) means decision and selection only. Never error, never hover decoration (decision z, gaps B2, B3).
- Error uses the intent critical slot, always with an icon and text. Never color alone.
- dot-dim is decorative only. Every control boundary uses border.control at 3:1 or higher in both modes (decision aa).

## 6. Type

Pending decision y (Prompt 2 walkthrough). Fixed regardless of the outcome: Doto is display only (instruction), minimum text sizes per platform, Instrument Serif eyebrow is a named exception if kept. Gap audit proposal: Doto for display and big numbers, Inter for body, labels, inputs, helper and error text.

## 7. Master library

File: "JTC Dot Master Design Kit". Pages: Cover, Read me, Foundations, one page per group (Forms, Actions, Feedback for MVP), Templates, Review, Changelog. Follows tidy-figma-file and figma-librarian rules.

### Definition of done for every master
1. Master component with size variants sm / md / lg (decision w; sm only where dense desktop applies)
2. State variants: default, hover, focus, pressed, disabled, error, filled, read-only, loading, success, warning (11, decision s). A state that can't apply to a component is listed as "n/a" in its description with the reason.
3. Every fill, stroke and text bound to a variable. 0 raw hex.
4. Auto layout and component properties
5. Description in one template (gap E1): what it is · use when · don't use when (and what instead) · states · keyboard · accessibility · content rules
6. Passes contrast in Dark and Light; visible focus in both
7. Disabled submit only with a visible reason next to it (decision t)

### MVP masters (29, metric 1)
- Forms (16): text input, textarea, select, combobox, checkbox, radio, switch, slider, date picker, file upload, field label, helper text, error text, form section, form layout, validation summary
- Actions (3): button (primary, secondary, ghost, destructive, icon), link, button group
- Feedback (10): toast, banner, inline notice, modal, dialog, tooltip, progress bar, spinner, skeleton, empty state
- Cut rule floor: 17 (Forms 16 + button)

Names follow decision dd: Wizard steps, Numbered steps, Number input; Tag is static, Chip is interactive.

## 8. Accessibility (WCAG 2.2 AA, every brand)

- Every text/background pair checked in both modes: 4.5:1 normal text, 3:1 large text and UI parts. A failing pair is blocked and the nearest passing token is suggested.
- Visible focus in both modes. Fields have label, helper and error text; errors set aria-invalid and aria-describedby (gap C3).
- Reduced motion honored. Touch targets 24px minimum, 44px for primary.
- Keyboard and ARIA behavior written per interactive master, in its description and the contract (gap C5).
- The review agent can't return Stable on anything that fails.

## 9. Contract v1 (Prompt 4)

One rules format any team fills in. DTCG tokens carry rule fields (decision g); components get their own rules file because they aren't tokens.

```
contract/
  tokens      → DTCG with $extensions.cadence: { use, dontUse, pairsWith, a11y }
  components  → one entry per master: job, useWhen, dontUseWhen, insteadUse,
                states, keyboard, a11y, contentRules, figmaKey, codeTag
  visuals     → Visual Asset Framework: does this moment need a visual at all,
                then which one and why
```

The plugin, checker and MCP server read the contract and the library, never hard-coded values. Gaps get flagged, never guessed.

## 10. Ownership and change flow

- Agents read masters (Figma MCP + contract) and build with instances. They never edit, detach or rename a master.
- Agent proposals go on the Review page; Julie approves row by row.
- Direct edits on masters; publishing is the gate (decision k). Branch only for breaking changes.
- Change flow: edit → audit (no raw hex, no detached instances, contrast both modes, focus intact, descriptions updated) → publish with note → accept updates → sync variables to repo → Code Connect flags code → checker re-runs → changelog + version.
- Versioning: major = breaking, minor = additions, patch = fixes. Renaming or removing a variant or property is breaking: deprecation note and migration path first; contract rules update in the same change.

## 11. Shipped, logged, measured

- Shipped = published, versioned, checked, used in a real build.
- Log entry: date · version · what shipped · proof link · checks passed (claude/shipped-log.md and the repo changelog, decision m).
- Dashboard: bottom section of the Design + AI page (decision n), hours saved only (decision o). Every number from a log or a system; empty tiles say "Collecting since 11/16".

## 12. Milestones and go/no-go

Interview guard: stop 1 hour before any interview. Wing screen Tue 11/17 3:30 PM ET, so no build after 2:30 PM Tue. Atlassian Values interview possibly Tue to Thu: check calendar each morning. One job application per day stays on.

| Prompt | When | Ships | Go criteria (all checked before next prompt) |
|---|---|---|---|
| 1 | Mon 11/16 | SPEC.md (not a ship) | Julie approves spec; Prompt 2 blockers decided (done 11/16) |
| 2 | Tue AM | Foundations, v0.1.0 | Palette + Light values approved row by row on Review page; jtc-dot.json builds; variables in Figma match repo (0 drift); contrast table 100% pass both modes |
| 2.5 | Tue | Forms reference intake | Forms coverage matrix filled |
| 3 | Tue to Wed | Forms masters, v0.2.0 | 16 masters meet definition of done; error cases use icon + text |
| 4 | Wed | Actions + Feedback + Contract v1, v0.3.0 | 13 masters done; contract validates; selection evals v1 scored |
| 5 | Thu | Checker + CI; Cadence site on the kit | Checker catches 2 of 2 planted failures |
| 6 | Fri | MVP: Design + AI page, dashboard | Metrics 1 to 5 true |
| 7 | Sun 11/22 | Retro | Reads fix log and selection scores |

## 13. Open before Prompt 2 can start

Decided and logged: A1, A3, B5 (x, c), A5 (y, during merge), A10 (bb), B1, B2 (z), C1 (aa).
Logged 11/16 as decisions ee to mm (proposed answers from claude/system-gap-audit.md): A2, A4, A6, A7, A8, A9, B3, B4, C2. Error naming logged as nn.
Nothing blocks Prompt 2 except the go on this spec.

## 14. Flags (checked 11/16 by reading the repo)

- Repo layout: the package lives in a nested cadence-kit/cadence-kit/ folder with a duplicate README at the root. Not fixing; flagging.
- Repo default brand is still Cadence blue (commit dd444e2, 10/23, "silk palette"). Decision b makes JTC Dot the default look; the build default switches in Prompt 2.
- Naming: error uses the existing mode.intent.critical slot; the contract documents critical = error (decision nn).
- No SPEC.md, shipped-log or changelog in the repo yet.

## Parking lot
- Clean up the nested repo folder (one-time, breaking for any path references)

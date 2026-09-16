# DESIGN.md: Apple.com

## Source
- URL: https://www.apple.com/
- Capture date: 2026-09-16
- Evidence: Firecrawl scrape — `branding` block (colors, typography, components, personality), `markdown` (copy, section order, image URLs), `links`, and a 1440×7022 full-page screenshot. Two scrapes, 2 credits.
- Confidence (reported by extractor): colors 0.90, buttons 0.95, overall 0.925

> **Rights note:** this file documents an observed visual language for study and inspiration. It does **not** grant any right to Apple's logo, product imagery, trademarks, product names, or copy. Reuse the *system* (scale, rhythm, token relationships) — supply your own brand assets and words.

## Reference Screenshot
![Full-page screenshot of Apple.com](./.firecrawl/apple-screenshot.png)

Use this screenshot as the visual source of truth for layout, hierarchy, density, and feel. Tokens below describe the same page in machine-readable form.

> **The image above is a local scrape artifact and is not in version control** — `.firecrawl/` is gitignored, so this link renders only for whoever ran the capture. Regenerate it with the Rerun Inputs at the bottom of this file.

## Design Summary

A **high-contrast, shadowless, photography-led** system. The page is a vertical stack of full-bleed "stages," each alternating between near-black and near-white, with centered text sitting *above* a large product image. There is no card chrome, no elevation, and almost no color — one blue carries every interactive affordance. Density is deliberately low: huge vertical padding, short copy, generous negative space. The product photography *is* the design; the UI recedes to near-invisibility.

An agent recreating this should resist adding shadows, borders, gradients, or accent colors. The entire effect comes from **scale contrast** (very large headline against very small supporting text), **alternating background polarity**, and **full-pill buttons as the only decorated element**.

## Design Tokens

### Colors

All values observed from the `branding` extraction.

| Token | Hex | Role |
|---|---|---|
| `--color-accent` | `#0071E3` | Primary button fill; the single brand interactive color |
| `--color-accent-text` | `#0066CC` | Secondary button text + border (slightly darker than fill blue) |
| `--color-link` | `#2997FF` | Inline links — brighter, tuned for dark backgrounds |
| `--color-bg` | `#FFFFFF` | Default page background |
| `--color-bg-alt` | `#F5F5F7` | Light section bands, secondary button fill |
| `--color-bg-invert` | `#000000` | Dark stage backgrounds *(inferred from screenshot)* |
| `--color-text` | `#333336` | Body copy — **not** pure black |
| `--color-text-invert` | `#F5F5F7` | Text on dark stages *(inferred)* |

Two details worth preserving: body text is `#333336`, a very slightly warm dark gray rather than `#000`; and the "blue" is actually **three** blues with distinct jobs (fill `#0071E3`, secondary text `#0066CC`, link `#2997FF`).

### Typography

Observed families and stacks:

```css
--font-display: "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-text:    "SF Pro Text",    "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

`SF Pro Display` carries headings, `SF Pro Text` carries body. `Myriad Set Pro` appears as a legacy display fallback. SF Pro is not web-licensed for general use — **substitute Inter, Geist, or the `-apple-system` / `system-ui` stack**, which resolves to SF Pro on Apple devices and degrades gracefully elsewhere.

Type scale — **inferred** by measuring the 1440px-wide screenshot. The extractor's own `fontSizes` block returned `h1: 34px / h2: 12px / body: 28px`, which is internally inconsistent (body larger than h1) and should be disregarded as a sampling artifact.

| Role | Size (inferred) | Weight | Notes |
|---|---|---|---|
| Stage headline | 48–56px | 600 | Product name; tight leading (~1.05) |
| Stage subhead | 24–28px | 400–500 | The one-line hook |
| Availability / meta | 16–17px | 400 | Sits under subhead, often muted |
| Button label | 17px | 400 | |
| Nav item | 12px | 400 | Notably tiny |
| Footnote | 11–12px | 400 | Gray, dense, bottom of page |

The signal here is the **ratio**, not the absolute values: roughly 4–5× between headline and nav/footnote, with nothing in the middle. Apple skips the mid-range sizes most design systems lean on.

### Spacing And Layout

```css
--space-unit: 4px;        /* observed base unit */
--radius-pill: 980px;     /* observed — buttons */
--radius-default: 0px;    /* observed — inputs, containers, images */
--shadow: none;           /* observed — every component */
--container-max: 1080px;  /* inferred from screenshot text column */
```

- **Base unit 4px** (observed). Section padding is very large — roughly 120–180px vertical per stage *(inferred)*.
- **`border-radius: 980px`** on buttons is the signature: an intentionally absurd value that guarantees a perfect capsule at any height. Everything else is `0px`.
- **`shadow: none` on every component** (observed). There is no elevation system at all.
- Stage heights run ~580–700px at 1440px wide *(inferred)*.

## Components

### Buttons — the only decorated element

```css
.btn-primary {
  background: #0071E3; color: #FFFFFF;
  border: none; border-radius: 980px;
  padding: 12px 24px; font-size: 17px; box-shadow: none;
}
.btn-secondary {
  background: #F5F5F7; color: #0066CC;
  border: 1px solid #0066CC; border-radius: 980px;
  padding: 12px 24px; font-size: 17px; box-shadow: none;
}
```

Buttons appear in **pairs**, side by side, centered: a filled primary (`Learn more`) next to an outlined secondary (`Buy` / `Pre-order` / `View pricing`). On dark stages the same pair inverts to a blue fill plus a blue-outlined ghost.

### Inputs
Transparent background, `border-radius: 0`, no shadow, text `#333336`. Effectively invisible until focused — search is an icon that expands.

### Global nav
Full-width, ~44px tall, near-black, 12px items, evenly distributed, no underlines. Apple logo left, search + bag right. Above it sits an optional **promo strip**: light gray, centered, ~12px, one sentence plus a link.

### Stage (the core repeating unit)
Full-bleed section. Centered text block at top — headline, subhead, availability line, button pair — with product photography filling the space below, often bleeding to the viewport edges. Background alternates black / white / `#F5F5F7`.

### Tile grid
Below the full-width stages, the same stage anatomy at **half width, 2-up**, with a thin light gutter between. Tiles keep their own background polarity, producing a checkerboard (black tile beside light tile).

### Footer
Extremely deep multi-column link farm (8 column groups), 12px type, generous line-height, preceded by numbered legal footnotes in 11px gray. Closing bar: country selector, copyright, 5 legal links.

## Page Patterns

Observed section order:

1. Promo strip (dismissible, optional)
2. Global nav (dark, sticky)
3. Hero stage — dark, largest type
4. Full-width stage — light
5. Full-width stage — dark
6. Tile grid, 2-up, alternating polarity (6–8 tiles)
7. Editorial carousel ("Endless entertainment.") — horizontally scrolling media cards
8. Legal footnotes
9. Deep footer + closing bar

**Responsive assumptions** *(inferred — only desktop was captured)*: the 2-up tile grid almost certainly collapses to 1-up under ~734px; stage type scales down roughly 40%; nav collapses to a hamburger. Verify against a mobile capture before relying on these.

## Content Style

- **Headlines are the product name.** Nothing else. "iPhone 18 Pro", "AirPods 5", "MacBook Air".
- **Subheads are 2–6 word fragments**, frequently without verbs: *"Pro further."* · *"Hello, hello."* · *"A battery you can't outrun."* · *"Now supercharged by M5."*
- **Sentence case throughout**, terminal period on fragments.
- **CTA verbs are a closed set**: `Learn more`, `Buy`, `Pre-order`, `View pricing`, `Apply now`. Primary is always the soft option (`Learn more`); the commercial ask is secondary.
- **A dated availability line** is its own element between subhead and buttons: *"Available starting 9.18"*.
- Superscript footnote markers on any claim, resolved in the legal block.
- Extracted personality: tone `modern`, energy `high`, audience `tech-savvy consumers`, framework `custom` (bespoke — no component library).

## Agent Build Instructions

To build a new site in this language:

1. **Set the tokens** above as CSS custom properties on `:root`. Substitute `system-ui` / Inter for SF Pro. Pick your own accent to replace `#0071E3` — keep the three-blue structure (fill / secondary-text / link) rather than collapsing to one.
2. **Build one `Stage` component** and reuse it for everything. Props: `background` (`dark` | `light` | `alt`), `headline`, `subhead`, `meta`, `primaryCta`, `secondaryCta`, `image`. The whole page is this component repeated.
3. **Alternate background polarity** on every consecutive stage. This is the primary rhythm device — get it wrong and the page reads as generic.
4. **Enforce the type ratio**: headline ~50px, supporting text ~17px, nav/footnote ~12px. Do not introduce mid-range sizes.
5. **Ban shadows and border-radius** everywhere except buttons, which get `border-radius: 980px`. No cards, no outlines, no dividers except hairline grid gutters.
6. **Let imagery do the work.** Every stage needs a real, high-quality, full-bleed image. This system fails completely with placeholder or stock-looking art — there is no other visual interest to fall back on.
7. **Write copy to the constraint**: headline = product name, subhead ≤ 6 words, two CTAs, one of them soft.
8. **Pair every claim with a footnote** if you want the same authoritative register.

Do not copy Apple's images, logo, product names, or copy into the result.

## Rerun Inputs
```
workflow: firecrawl-website-design-clone
source_url: https://www.apple.com/
target_stack: stack-neutral HTML/CSS (no stack specified)
output: DESIGN.md
```

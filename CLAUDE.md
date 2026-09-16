# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Preferences

### Copying a website's style/design

Whenever the user wants to copy, clone, match, or take inspiration from the
look of an existing website (e.g. "make it look like apple.com", "I like how
stripe.com does this", "copy this site's style"), remind them to use Firecrawl
first — don't guess at the design from memory or from a screenshot.

Preferred route: the `firecrawl-website-design-clone` skill, which extracts the
site's real design system (colors, type scale, spacing, components, layout
patterns) into an agent-ready DESIGN.md, then builds from that.

CLI equivalent: `firecrawl scrape <url> -o .firecrawl/<name>.md`

The point is to work from scraped evidence of the actual site rather than an
approximation. Relevant here for `poster.html` and anything under `static/`.

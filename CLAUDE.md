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

### Client emails (Gmail drafts)

Build and preview the email HTML here first, and let the user review and
request changes on the preview. Save it to Gmail **once**, at the end, after
the user approves. Don't push every small change to the Gmail draft: the
Gmail connector can't edit a draft in place, so each save re-sends the whole
email and its images, which is slow.

Don't suggest pasting raw HTML into Gmail's compose window. Gmail can't take
raw HTML, and copying a rendered page drops inline images such as the map.

### Mortgage referrals

The user's go-to loan officer is Laila Qrochi. When the user writes "Layla",
"layla" or "Laila", they mean her ("ليلى قروشي" in Arabic emails) (American Pacific Mortgage,
NMLS #2115498, phone and WhatsApp +1 540-327-5863,
laila.qrochi@apmortgage.com). Her contact card is `contacts/laila-qrochi.vcf`,
and `contacts/laila-referral-blurb.txt` is a ready-to-send bilingual
(Arabic/English) referral message with her pre-approval signup link. Use these
whenever the user refers a client to her.

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

### Brand logo on every HTML

The user's brand logo is the AM house-and-key mark in `brand/am-logo.png`
(from ahmedknows.com, which redirects to amnovahomes.com; alt text "AM Real
Estate — Ahmed Makkiyah"). When the user says "my brand logo" or "my logo",
this is the image they mean. Put it at the top of every client email or HTML
page: a white rounded tile about 48px tall, centered in the header, above the
title. The file is small (94×96), so don't show it larger than about 96px.

### Brand signature on every HTML

Every client email or HTML page ends with the user's brand signature:
`brand/signature.html` (Ahmed "Steve" Makkiyah, REALTOR®, Douglas Realty of
Virginia, NVAR Top Producer 2020–2025, mobile 734.383.6945, direct
703.957.0060, links, license line, wire-fraud warning). Its banner image,
`brand/signature-banner.jpg`, is the signature banner. Never leave the
signature, the banner or the logo out.

Fill `{{BANNER_SRC}}` with a data URI of the banner for previews. Do the same
for the logo. When saving through the Gmail connector, attach the logo and the
banner as inline images and use `cid:attN`, because the connector strips every
other image.

### Mortgage referrals

The user's go-to loan officer is Laila Qrochi. When the user writes "Layla",
"layla" or "Laila", they mean her ("ليلى قروشي" in Arabic emails) (American Pacific Mortgage,
NMLS #2115498, phone and WhatsApp +1 540-327-5863,
laila.qrochi@apmortgage.com). Her contact card is `contacts/laila-qrochi.vcf`,
and `contacts/laila-referral-blurb.txt` is a ready-to-send bilingual
(Arabic/English) referral message with her pre-approval signup link. Use these
whenever the user refers a client to her.

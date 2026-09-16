# Vendored type

| file | family | source |
|---|---|---|
| `Geist-latin.woff2` | Geist, variable 100–900 | Google Fonts (`fonts.gstatic.com/s/geist/v5`) |
| `GeistMono-latin.woff2` | Geist Mono, variable 100–900 | Google Fonts (`fonts.gstatic.com/s/geistmono/v6`) |

Latin subset only — the piece sets no other script. Both faces are licensed under the
SIL Open Font License 1.1 (https://openfontlicense.org), which permits redistribution
alongside this project.

They are vendored rather than fetched so a render never depends on the network, and so
a headless browser without egress still lays the type out exactly as the brief specifies.

# Alternative Real-Time Feeds for Moroccan Outlets Without RSS (Médias24, H24info, Le360, Hespress)

## Executive Summary

This report identifies and evaluates practical alternatives to Really Simple Syndication (RSS) for four major Moroccan news outlets—Médias24, H24info, Le360, and Hespress—where publicly advertised RSS is absent or limited. The analysis is current as of 3 November 2025 and is grounded in direct endpoint discovery, verification, and structured testing.

Three findings reshape the implementation landscape. First, multiple outlets expose hidden or non-advertised RSS and JSON endpoints: Médias24 offers a working RSS feed and a WordPress REST API; Hespress English provides a working RSS feed; H24info exposes a WordPress REST API suitable for near-real-time ingestion.[^1][^2][^3][^4] Second, on-page “live” or ticker sections—Le360’s Fil d’actualité and H24info’s Le Flash—function as real-time update cues, even though their corresponding /live or /flash URLs do not serve feeds.[^5][^6][^7] Third, sitemaps, sitemaps for news, and a “Nos lives” library at Médias24 provide additional discovery scaffolds and coverage for special events, while structured datasets from Médias24 (e.g., legal notices, tenders, financial communications) complement editorial ingestion with high-value business data.[^8][^9][^10][^11][^12][^13]

Implementation should prioritize feeds and JSON APIs when available (stable, parseable, and lighter-weight), then use sitemaps and server-rendered HTML for discovery and fallback, and finally interpret ticker/live sections as signals for incremental scraping. Where rate limits or Cloudflare challenges exist (notably on Hespress English), conservative polling, respectful crawl budgets, and resilient backoff policies are required. Recommendations by outlet:

- Médias24: use RSS and WordPress REST API as primary feeds; leverage sitemaps for discovery; poll “Nos lives” for event coverage.[^1][^2][^9][^10]
- H24info: use WordPress REST API as primary near-real-time JSON feed; parse Le Flash section and category/subcategory pages for completeness and redundancy.[^4][^6]
- Le360: use HTML parsing of Fil d’actualité and À la Une; sitemaps present via robots.txt; evaluate Arabic site parity.[^5][^8]
- Hespress English: use RSS feed; supplement with HTML parsing of “latest” listings; anticipate Cloudflare checks.[^3][^7]

The result is a robust, resilient pipeline that blends explicit feeds/APIs for efficiency with careful scraping and structured discovery for coverage, while maintaining compliance and operational safety.

## Methodology and Verification Approach

We approached discovery with five complementary techniques: systematic probing of common feed endpoints; parsing robots.txt for sitemaps and feed hints; testing WordPress REST API exposure; evaluation of on-page live/ticker sections; and technical testing for alternative streaming or JSON endpoints. Each candidate endpoint was validated through multiple requests, with structural checks to confirm XML/RSS or JSON viability and to identify access barriers such as Cloudflare challenges. This report uses official outlet pages and endpoint references as the evidence base, with discovery baselines current as of 3 November 2025.[^14][^15][^6][^7][^5]

Where endpoints returned non-200 codes or content was blocked, we recorded the behavior and identified alternative routes. Sitemaps were prioritized for discovery when explicit feeds were missing. WordPress REST API exposure (JSON) was treated as a viable near-real-time feed when consistent and parseable. Live/ticker sections were analyzed for their timestamp granularity and update cadence to shape polling intervals and incremental scraping strategies.

## Outlet-by-Outlet Discovery and Results

### Médias24

Discovery uncovered both RSS and JSON feeds, plus live content and dataset sections. The RSS feed at /feed is active and parseable, and the WordPress REST API at /wp-json/wp/v2/posts returns JSON objects with timestamped posts. Robots.txt explicitly references sitemaps, including a news sitemap and a sitemap index, and the site provides a “Nos lives” library for real-time event coverage.[^1][^2][^9][^10] Beyond editorial coverage, Médias24 exposes structured datasets—anonces légales, annonces judiciaires, appels d’offres, and financial communications—that are valuable complements for business and regulatory monitoring.[^12][^13][^11]

To illustrate concrete payload structure and field mapping, the following example shows a representative JSON item returned by the WordPress REST API. The fields can be mapped directly into downstream processing schemas:

Table 1. Sample WordPress REST API payload fields (Médias24)

| Field                       | Description                                   | Example                                     |
|----------------------------|-----------------------------------------------|---------------------------------------------|
| id                         | Unique post identifier                        | 1572508                                     |
| date / date_gmt            | Publication timestamp (local/GMT)             | 2025-11-02T12:15:03 / 2025-11-02T11:15:03  |
| modified / modified_gmt    | Last modification timestamp (local/GMT)       | 2025-11-02T12:15:03 / 2025-11-02T11:15:03  |
| slug                       | URL-friendly identifier                       | maroc-telecom-5g-cours-potentiel-bourse    |
| status                     | Publication status                            | publish                                     |
| type                       | Content type                                  | post                                        |
| link                       | Canonical URL                                 | https://medias24.com/...                    |
| title.rendered             | HTML-encoded title                            | “Maroc Telecom: 5G already in share price…” |
| content.rendered           | Full HTML content                             | <p>...</p>                                   |

Operational guidance: prefer the RSS feed and the WordPress REST API for primary ingestion due to their stability and structure; use sitemaps as a discovery scaffold, and poll “Nos lives” on significant event days to capture live coverage. Respect conservative rate limits, and align polling intervals to observed cadence.

[^1]: Médias24 – Portal.
[^2]: Médias24 – RSS (WordPress feed).
[^9]: Médias24 – Sitemap index.
[^10]: Médias24 – News sitemap.
[^11]: Médias24 – Communication financière.
[^12]: Médias24 – Annonces légales.
[^13]: Médias24 – Appels d’offres.

### H24info

The WordPress REST API is exposed and returns near-real-time JSON posts suitable for incremental updates. On the site, “Le Flash” functions as a near-real-time ticker with minute-level timestamps, suggesting short polling intervals (e.g., every 2–5 minutes during daytime hours) to capture updates without imposing load. Common feed endpoints (/feed, /rss, /live, /flash) return 404s, and the site’s robots.txt references a sitemap index.[^4][^6][^16]

To ground parsing expectations, the table below outlines representative fields returned by the WordPress REST API, including identifiers, timestamps, slugs, links, titles, excerpts, and taxonomy tags. These enable deduplication, ordering by recency, and section-level enrichment.

Table 2. Representative WordPress REST API fields (H24info)

| Field                     | Description                                   | Example                                          |
|--------------------------|-----------------------------------------------|--------------------------------------------------|
| id                        | Unique post identifier                        | 958751                                           |
| date / date_gmt          | Publication timestamp (local/GMT)             | 2025-11-02T22:30:10 / 2025-11-02T21:30:10       |
| modified / modified_gmt  | Last modification timestamp (local/GMT)       | 2025-11-02T21:45:23 / 2025-11-02T20:45:23       |
| slug                      | URL-friendly identifier                       | gaza-israel-recupere-les-depouilles-de-3-otages |
| link                      | Canonical URL                                 | https://h24info.ma/monde/...                     |
| title.rendered            | Article title                                 | “Gaza: Israël récupère les dépouilles…”         |
| excerpt.rendered          | Summary (may be empty)                        | “”                                              |
| categories                | Category IDs                                  | [4]                                             |
| tags                      | Tag IDs                                       | [10537, 89474, 2672, …]                          |

Operational guidance: use the WordPress REST API for primary ingestion; parse “Le Flash” as an additional signal and for headline synchronization; rely on categories for section-level attribution. Maintain conservative polling intervals and monitor for changes in API behavior.

[^4]: H24info – WordPress REST API: posts.
[^6]: H24info – Homepage (Le Flash).
[^16]: H24info – Sitemap index.

### Le360

Le360 does not expose RSS or JSON feeds via common endpoints; instead, its homepage offers a chronological Fil d'actualité (news feed) with timestamps, and the Arabic site mirrors content. Robots.txt lists sitemaps. Because no JSON feed or live ticker endpoint was found, server-rendered HTML parsing is the practical route, supplemented by sitemap discovery and language-aware tracking.[^5][^8][^17]

The table below summarizes the observed update cadence and timestamp formats from the Fil d’actualité, including both relative (“Il y a X heures”) and absolute (DD.MM.YYYY – HH:MM) forms. These patterns inform timestamp extraction and incremental crawl logic.

Table 3. Observed timestamps from Fil d’actualité (Le360)

| Timestamp format          | Example                                  | Interpretation                               |
|--------------------------|-------------------------------------------|----------------------------------------------|
| Relative (“Il y a X heures”) | “Il y a 6 heures”                        | Recent updates; no date shown                |
| Absolute (DD.MM.YYYY – HH:MM) | “02.11.2025 – 21:09”, “02.11.2025 – 21:05” | Precise publication time; date in article URL |

Operational guidance: parse the Fil d’actualité and À la Une as primary discovery surfaces; use sitemaps for completeness; consider bilingual coverage and regional editions in your data model. Adjust polling to observed daytime frequencies and prioritize recency extraction.

[^5]: Le360 – French site.
[^8]: Le360 – robots.txt.
[^17]: Le360 – Arabic site.

### Hespress

Hespress English exposes a working RSS feed and an RSS-like sitemap for news via robots.txt. The English homepage presents a “latest” listing updated frequently, but an observed /live page is protected by Cloudflare, and access to JSON endpoints may be challenged. Ingestion should prioritize the RSS feed and supplement with HTML parsing for latest listings.[^3][^7][^18]

To guide polling and payload awareness, the table below outlines core RSS elements observed for Hespress English:

Table 4. Core RSS elements (Hespress English)

| Element        | Description                          | Example                                           |
|----------------|--------------------------------------|---------------------------------------------------|
| title          | Channel title                        | “HESPRESS English – Morocco News”                |
| link           | Channel URL                          | https://en.hespress.com/                          |
| language       | Content language                     | en-US                                             |
| lastBuildDate  | Last build timestamp                 | Sun, 02 Nov 2025 19:24:18 +0000                   |
| update period/frequency | Update cadence               | hourly / 1                                        |
| item title     | Article title                        | “Sahrawi tribal leaders in Laayoune…”            |
| item pubDate   | Publication timestamp                | Sun, 02 Nov 2025 23:22:12 +0000                   |
| item link      | Canonical URL                        | https://en.hespress.com/124706-...                |
| item guid      | Global identifier                    | https://en.hespress.com/?p=124706                 |
| categories     | Topic tags                           | Politics, Moroccan Sahara, UNSC                   |

Operational guidance: poll the RSS feed at conservative intervals (e.g., every 5–10 minutes during active hours); parse the “latest” HTML listing for supplemental updates; anticipate Cloudflare verification and implement respectful backoff.

[^3]: Hespress English – RSS (WordPress feed).
[^7]: Hespress English – Homepage.
[^18]: Hespress English – Sitemap news.

## Comparative Analysis: Feeds, Sitemaps, JSON APIs, and Live Sections

The outlets differ in how they expose content for discovery and near-real-time ingestion. Médias24 and H24info provide JSON APIs; Hespress English offers RSS; Le360 relies on server-rendered feeds. Across all, sitemaps and on-page live/ticker sections act as secondary discovery signals.

Table 5. Endpoint matrix: availability, URLs, and access notes

| Outlet       | RSS | JSON (WP REST API) | Sitemaps | Live Sections         | Access Notes                                 |
|--------------|-----|--------------------|----------|-----------------------|----------------------------------------------|
| Médias24     | Yes (/feed) [^2]  | Yes (/wp-json/wp/v2/posts) [^1] | Yes (index + news) [^9][^10] | “Nos lives” library [^1] | Prefer RSS/API; sitemaps for discovery       |
| H24info      | No (404s)         | Yes (/wp-json/wp/v2/posts) [^4] | Yes (index) [^16]    | “Le Flash” ticker [^6]    | Prefer JSON; parse ticker for freshness      |
| Le360        | No (404s)         | No (404s)             | Yes (via robots) [^8] | Fil d’actualité [^5]      | Parse HTML; timestamps in listings           |
| Hespress EN  | Yes (/feed) [^3]  | Unreliable/Cloudflare | News sitemap [^18]    | “Latest” listings [^7]     | Prefer RSS; HTML supplement; Cloudflare gate |

Table 6. Live/ticker sections overview

| Outlet       | Section             | Update Cadence                   | Implementation Implication                        |
|--------------|---------------------|----------------------------------|---------------------------------------------------|
| Médias24     | “Nos lives”         | Event-based, archived live pages | Poll during major events; use for context         |
| H24info      | “Le Flash”          | Minute-level updates             | Short polling; incremental by timestamp           |
| Le360        | Fil d’actualité     | Hourly/daily timestamps          | Parse server-rendered HTML; dedupe by link/slug   |
| Hespress EN  | “Latest”            | Multiple daily updates           | RSS primary; HTML for parity and supplemental     |

The matrix underscores a practical pipeline: use explicit feeds where present (RSS or JSON), lean on sitemaps for coverage discovery, and interpret live/ticker sections as structured HTML cues for incremental scraping.

## Technical Implementation: Polling, Endpoints, and Parsing

Primary ingestion should favor structured endpoints:

- RSS feeds (Hespress English; Médias24) for stable, lower-maintenance parsing.[^3][^2]
- WordPress REST API (Médias24; H24info) for near-real-time JSON, enabling timestamp-based incremental updates.[^1][^4]

For discovery and fallback, parse sitemaps (Médias24, H24info, Le360 via robots.txt; Hespress English news sitemap) to find recent articles and maintain coverage baselines.[^9][^10][^16][^8][^18] Server-rendered HTML sections—Le360’s Fil d’actualité and H24info’s Le Flash—should be treated as “live” signals guiding short-interval polling during active hours.[^5][^6]

Incremental updates should use post IDs, GUIDs, and timestamps (date/date_gmt, modified/modified_gmt) to avoid duplicates and to ensure ordering. Rate limiting and backoff must be conservative, with staggered polling across outlets to minimize load. Authentication is not required for the observed RSS and JSON endpoints; however, Cloudflare challenges may intermittently affect Hespress English access and must be handled gracefully.[^3][^7]

Table 7. Recommended polling intervals and refresh strategies

| Outlet       | Primary Endpoint       | Suggested Interval           | Strategy                                         |
|--------------|------------------------|------------------------------|--------------------------------------------------|
| Médias24     | RSS / WP REST          | 5–10 minutes (daytime)       | Incremental by timestamp; sitemaps for baseline  |
| H24info      | WP REST                | 2–5 minutes (daytime)        | Incremental by date_gmt; parse “Le Flash”        |
| Le360        | HTML listings          | 10–15 minutes (daytime)      | Parse Fil d’actualité; dedupe by link/slug       |
| Hespress EN  | RSS                    | 5–10 minutes (daytime)       | Incremental by pubDate; HTML “latest” supplement |

## Risk, Compliance, and Access Constraints

Compliance with robots.txt and site terms is mandatory. Respect crawl budgets and avoid imposing load through aggressive polling. Anticipate Cloudflare challenges on Hespress English; implement backoff, jitter, and, where appropriate, human-in-the-loop verification for sustained access issues.[^7] Some dynamic elements—ads, lazy-loaded images—may be present; plan ad-content filtering and focus on server-rendered listings for structural reliability.

## Recommendations and Rollout Plan

Adopt a tiered ingestion strategy: feeds/APIs first; sitemaps next; HTML parsing for live/ticker sections. The rollout should prioritize Médias24 and H24info due to their JSON APIs, followed by Hespress English RSS, then Le360 HTML parsing.

Table 8. Phase-by-phase rollout plan

| Phase | Outlet(s)      | Primary Endpoints              | Milestones                                       |
|-------|----------------|--------------------------------|--------------------------------------------------|
| 1     | Médias24       | RSS + WP REST; sitemaps        | Stabilize parsing; dedupe by GUID; cadence tuning |
| 2     | H24info        | WP REST; “Le Flash” parsing    | Timestamp-based incremental; category enrichment  |
| 3     | Hespress EN    | RSS; “latest” HTML             | RSS poller; Cloudflare-aware backoff              |
| 4     | Le360          | Fil d’actualité; À la Une      | Timestamp extraction; bilingual data model        |

Rollout should include instrumentation for coverage metrics, monitoring for endpoint changes, and alerting for access constraints or cadence shifts. Adjust polling intervals as needed based on observed update patterns and server responsiveness.

## Appendices

### Appendix A: Tested endpoints and outcomes

Table 9. Endpoint test results (indicative)

| Outlet       | Endpoint                              | Status   | Notes                                                |
|--------------|----------------------------------------|----------|------------------------------------------------------|
| Médias24     | /feed                                  | OK (RSS) | Parseable; hourly updates observed                   |
| Médias24     | /wp-json/wp/v2/posts                   | OK (JSON)| Timestamp fields; stable payload                     |
| Médias24     | Sitemap index                          | OK       | Discovery scaffold                                   |
| Médias24     | News sitemap                           | OK       | Recent articles                                      |
| H24info      | /wp-json/wp/v2/posts                   | OK (JSON)| Near-real-time; minute-level updates                 |
| H24info      | Le Flash (HTML section)                | OK       | Live ticker on page                                  |
| H24info      | /feed, /rss, /live, /flash             | 404      | Not exposed                                          |
| Le360        | Fil d’actualité (HTML section)         | OK       | Timestamped listings                                 |
| Le360        | sitemaps (via robots.txt)              | OK       | Use for discovery                                    |
| Le360        | /feed, /live, /json                    | 404      | Not exposed                                          |
| Hespress EN  | /feed                                  | OK (RSS) | Hourly build; Cloudflare checks possible             |
| Hespress EN  | /live                                  | Blocked  | Cloudflare challenge                                 |
| Hespress EN  | News sitemap                           | OK       | Discovery scaffold                                   |

### Appendix B: Data models and field mapping for JSON/XML payloads

Table 10. Field mapping (JSON vs RSS)

| Concept         | JSON (WP REST)               | RSS (item/channel)            |
|-----------------|------------------------------|-------------------------------|
| Unique ID       | id                           | guid                          |
| Title           | title.rendered               | title                         |
| Permalink       | link                         | link                          |
| Publication time| date / date_gmt              | pubDate                       |
| Modification    | modified / modified_gmt      | n/a                           |
| Summary         | excerpt.rendered             | description                   |
| Categories/tags | categories / tags            | category                      |
| Content         | content.rendered             | content:encoded (if present)  |

### Appendix C: Observed update cadence snapshots (indicative)

- Médias24: Multiple daily publications; event-driven “live” coverage (e.g., key votes, press conferences). RSS shows hourly builds; homepage timestamps align with daily cadence.[^2][^1]
- H24info: Le Flash displays minute-level timestamps during active hours; REST API posts reflect frequent updates across the day.[^6][^4]
- Le360: Fil d'actualité lists articles with relative and absolute timestamps (e.g., “Il y a 6 heures”; 02.11.2025 – 21:09), indicating steady daytime updates.[^5]
- Hespress English: RSS indicates hourly builds; homepage “latest” listings show multiple daily entries.[^3][^7]

## Information Gaps

Three gaps warrant continued monitoring and, where appropriate, publisher outreach. First, Le360 does not expose obvious JSON or RSS endpoints; verification of any feed endpoints or alternative discovery mechanisms remains open. Second, Hespress English’s /live is protected by Cloudflare; programmatic access may require human verification or specific allowances. Third, observed sitemaps and “Nos lives” coverage exist, but comprehensive cadence analysis requires extended logging to fine-tune polling strategies. Finally, formal public API documentation for these outlets is not surfaced; endpoints may change without notice, and robots.txt constraints must be checked for production use.[^8][^7][^1][^2]

## References

[^1]: Médias24 – Portal. https://medias24.com/
[^2]: Médias24 – RSS (WordPress feed). https://medias24.com/feed
[^3]: Hespress English – RSS (WordPress feed). https://en.hespress.com/feed
[^4]: H24info – WordPress REST API: posts. https://h24info.ma/wp-json/wp/v2/posts
[^5]: Le360 – French site. https://fr.le360.ma/
[^6]: H24info – Homepage (Le Flash). https://h24info.ma/
[^7]: Hespress English – Homepage. https://en.hespress.com/
[^8]: Le360 – robots.txt. https://fr.le360.ma/robots.txt
[^9]: Médias24 – Sitemap index. https://medias24.com/sitemap_index.xml
[^10]: Médias24 – News sitemap. https://medias24.com/news-sitemap.xml
[^11]: Médias24 – Communication financière. https://medias24.com/communications/
[^12]: Médias24 – Annonces légales. https://annonceslegales.medias24.com/
[^13]: Médias24 – Appels d’offres. https://medias24.com/appelsoffres/
[^14]: H24info – robots.txt. https://h24info.ma/robots.txt
[^15]: Le360 – Arabic site. https://ar.le360.ma/
[^16]: H24info – Sitemap index. https://h24info.ma/sitemap_index.xml
[^17]: Le360 – Arabic site. https://ar.le360.ma/
[^18]: Hespress English – Sitemap news. https://en.hespress.com/sitemap-news.xml
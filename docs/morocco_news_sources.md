# Morocco News Sources 2025: Arabic and French Websites, Feeds, APIs, and Access Methods

## Executive Summary

This report identifies and evaluates the most relevant Morocco news sources in Arabic and French, along with prominent pan-Arab and international outlets with dedicated Morocco coverage. It maps accessible formats such as Really Simple Syndication (RSS) and any available application programming interfaces (APIs), documents observed update cadences, and assesses scraping viability to guide practical ingestion by data engineers and newsroom developers. It also highlights language distribution, content types, and special datasets embedded within select Moroccan outlets.

Key findings include:
- Moroccan outlets with reliable daily updates and deep sectioning include Médias24 (French, business-focused with dashboards and legal/tender datasets), L’Économiste (French, economic focus; XML sitemap confirmed), Aujourd’hui le Maroc (French, general news), H24info (French, high-frequency updates), LesEco.ma/Les Inspirations Éco (French/English versions; WordPress indicators), Le360 (French/Arabic), and Hespress (English and Arabic portal) [^1][^2][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12].
- Pan-Arab outlets covering Morocco with regular cadence include Al Jazeera Arabic (dedicated Morocco section; RSS available), Arab News (English; dedicated Morocco tag and RSS catalog), Al Arabiya English (dedicated Morocco location page; multi-language), and RT Arabic (dedicated Morocco tag; RSS noted) [^13][^14][^15][^16][^17][^18][^19][^20][^21][^22].
- RSS feeds are explicitly available for L’Économiste (via sitemap), Al Jazeera Arabic (general feed), and Arab News (category-level RSS). RT Arabic has a sitewide RSS, while the Morocco tag feed URL requires verification. Moroccan outlets largely do not expose public RSS or APIs; viable alternatives include sitemaps, HTML listing pages, and special datasets [^23][^21][^22][^20][^1][^2][^3][^4][^5][^6][^7][^8][^9].
- Observed update cadence: All major sources publish daily and frequently throughout the day; Al Jazeera Arabic shows multiple daily updates for Morocco. Arabic and English content coexist across outlets, with French dominant among leading Moroccan business titles [^1][^2][^13][^17].
- Scraping feasibility: Most Moroccan sites render core article listings server-side, enabling HTML parsing of category and tag pages. Some dynamic elements (ads, lazy images) are present but do not impede structured extraction [^7][^8][^9][^10][^12].
- Special datasets: Médias24 exposes dashboards and structured datasets (e.g., legal announcements, tenders, financial communications). These represent high-value, structured complements to news ingestion and should be prioritized [^2][^25][^26][^27][^28].
- Multi-language coverage: Several outlets offer both French and Arabic (Le360), English additions (LesEco.ma English version; Hespress English), and pan-Arab outlets with multi-language interfaces (Al Arabiya; Al Jazeera with Arabic hub) [^10][^11][^12][^8][^18][^13].

Immediate recommendations:
- Prioritize sources with confirmed RSS (Arab News, Al Jazeera Arabic; RT Arabic sitewide) and verified sitemaps (L’Économiste) to establish robust pipelines [^22][^21][^23].
- For Moroccan outlets without feeds, implement sitemap discovery and structured HTML parsing of category and archive pages; supplement with newsletter subscriptions and social channels as triggers where permissible [^4][^6][^24].
- Integrate high-value datasets from Médias24 to enrich economic and regulatory coverage (legal announcements, tenders, financial communications) [^25][^26][^27][^28].

Information gaps to resolve include explicit RSS verification for LesEco.ma, H24info, Aujourd’hui, and Hespress; public API documentation for Moroccan outlets; and technical specifics for Anadolu Agency’s Morocco office feeds or endpoints. These require follow-up discovery and direct publisher outreach [^7][^3][^9][^12][^30].

## Methodology and Scope

The research baseline is November 3, 2025. Sources were selected based on prominence within Morocco (Arabic and French), breadth of coverage, and availability of feeds/APIs or stable page structures suitable for ingestion. Evidence collection combined official outlet homepages and section pages, verification of RSS and sitemaps where publicly accessible, and analysis of content cadence across observed timestamps.

Limitations include lack of explicit RSS documentation for several Moroccan outlets; absence of publicly advertised APIs; and content extraction barriers on some third-party aggregator pages. Verification focused on primary publisher pages and direct feed endpoints, while aggregator claims were treated cautiously unless corroborated by official pages [^31].

## Morocco Media Landscape Overview

Morocco’s digital news ecosystem is bilingual, with Arabic and French coexisting across major outlets. Business and economic coverage is notably robust among French-language titles, aligning with the country’s media profile and consumption habits. Global context sources point to Arabic outlets achieving high reach and the importance of French-language business publications among influential titles. Recent digital news reporting also underscores evolving media consumption and platformization trends within Morocco [^31][^32][^33].

To illustrate the language distribution and editorial focus across the primary outlets covered in this report, Table 1 summarizes the landscape.

Table 1. Language distribution and editorial focus across selected outlets

| Outlet                      | Primary Languages | Editorial Focus                          |
|----------------------------|-------------------|------------------------------------------|
| Médias24                   | French            | Business, economy; datasets              |
| L’Économiste               | French            | Business/economy; sitemaps               |
| Aujourd’hui le Maroc       | French            | General news                             |
| H24info                    | French            | General news; high-frequency updates     |
| LesEco.ma / Les Inspirations Éco | French; English version | Business/economy; premium content    |
| Le360                      | French; Arabic    | General news; regional editions          |
| Hespress                   | English; Arabic   | General news; multi-language portal      |
| Al Jazeera Arabic          | Arabic            | Pan-Arab news; dedicated Morocco section |
| Arab News                  | English           | Pan-regional; Morocco tag                |
| Al Arabiya (English site)  | English; Arabic; Farsi; Urdu | Pan-regional; Morocco location page |
| RT Arabic                  | Arabic            | Pan-regional; Morocco tag                |
| BBC News Arabic            | Arabic            | International; Morocco topic page        |

This distribution informs ingestion priorities: French outlets anchor economic coverage and datasets, while Arabic and English outlets provide breadth and regional perspective [^31][^32][^33].

## Major Moroccan News Websites (French and Arabic)

Moroccan outlets exhibit consistent structures—clear navigation by topic, dedicated “flash” or “latest” sections, periodic dossiers or supplements, and special listings for legal and tender announcements. The following subsections profile each outlet and provide ingestion guidance.

### Médias24

定位: French-language, business-focused portal with comprehensive categories across economics, business, nation, society, diplomacy, culture, sport, and more. Notable special sections include the Médias24 Dashboard and branded studios. Update cadence is very frequent, with multiple daily publications [^1].

Technical access: No explicit RSS or public API identified. The site exposes valuable structured datasets:
- Dashboard portal (e.g., COVID-19 dashboard section)
- Annonces légales (legal announcements)
- Annonces judiciaires (judicial announcements)
- Appels d’offres (tenders)
- Communication financière (financial communications) [^2][^25][^26][^27][^28]

Ingestion recommendation: Monitor category and dataset pages; parse structured listings for legal/tender items and dashboard updates. Use newsletter subscriptions and “En ce moment” as near-real-time triggers. Respect site terms and implement conservative polling to align with update cadence [^1][^2].

### L’Économiste

定位: A leading French-language business daily. Content spans À la une, Flash Info (breaking), éditorials, dossiers, expert contributions, and video. The site exposes an XML sitemap index, a reliable scaffold for discovery; RSS feeds are not explicitly surfaced on-page [^3][^23].

Ingestion recommendation: Use the sitemap index for comprehensive coverage; implement category-level parsing where appropriate. Poll “Flash Info” for breaking updates with a short cadence while respecting server resources [^3][^23].

### Aujourd’hui le Maroc

定位: General news in French, spanning politique, société, économie, culture, sports, lifestyle, auto, and more. Observations show daily updates; subscription offerings are available. No explicit RSS/API discovered [^4][^24].

Ingestion recommendation: Category and archive pages are suitable for parsing. Use daily polling aligned to publication patterns and consider newsletter as a supplemental signal [^4][^24].

### H24info

定位: French-language portal with broad categories (Maroc, Économie, Monde, Culture, Sport, Lifestyle, Focus PME). The site features “Le Flash” for near-real-time updates and reports more than 30 million annual visits. No explicit RSS/API found; URLs follow clear category/subcategory/article-slug patterns [^5].

Ingestion recommendation: Parse category/subcategory and “Le Flash” sections; timestamp-based deltas will support efficient incremental updates [^5].

### LesEco.ma / Les Inspirations Éco

定位: French with an English version. Content covers Maroc, Éco-Business, Monde, Culture, Opinions, special dossiers, legal announcements, and partner content. WordPress indicators suggest typical WP discovery patterns. No explicit RSS/API surfaced in extracted content [^6][^8].

Ingestion recommendation: Explore WordPress-standard endpoints (e.g., wp-sitemap.xml) and parse category/tag pages for stable listings. Respect subscriber-only sections; treat premium content with appropriate access controls [^6][^8].

### Le360

定位: Moroccan outlet with French and Arabic versions, plus regional editions (Afrique, Sport). Content includes news, videos, opinion, “most read,” and caricatures. No explicit RSS/API found; some dynamic elements and ad-delivery mechanisms are present. Update cadence appears high, with multiple daily publications [^7].

Ingestion recommendation: Prefer server-rendered article listings; implement incremental updates based on timestamps. Consider language variants in the data model and plan for ad-related filtering [^7].

### Hespress (English and Arabic portal)

定位: Multi-language portal with English landing for international readers. Categories include Politics, Economy, Society, Culture, Sports, and Media. Update cadence appears frequent; RSS/API not surfaced in extracted content [^9][^12].

Ingestion recommendation: Build site maps by parsing category pages and “latest” listings. Use timestamp deltas to track new items; incorporate language tagging for English articles [^12].

## Arabic and International Outlets Covering Morocco

Pan-Arab and international outlets add regional context, alternative narratives, and additional feed options. They often present Morocco within location pages or dedicated tags, with multi-language interfaces supporting broader reach.

### Al Jazeera Arabic

定位: Arabic-language site with dedicated Morocco section under the Arab world hierarchy. Update cadence is multiple times per day. A general RSS feed is available; an explicit Morocco-only RSS feed was not surfaced in extracted content [^13][^21].

Ingestion recommendation: Use the general RSS and parse the Morocco section page. Maintain short polling intervals to match frequent updates [^13][^21].

### Al Arabiya (English site)

定位: Multi-language platform (Arabic, English, Farsi, Urdu). The English site provides a Morocco location page with categorized coverage (North Africa, World, Sports). A sitemap is present; RSS not surfaced in extracted content [^18].

Ingestion recommendation: Parse the Morocco location page; monitor the sitemap. Leverage language selection to scope content appropriately [^18].

### Arab News

定位: English-language outlet with a Morocco tag page aggregating relevant articles. An RSS catalog is available, including category-level feeds. RSS serves as a reliable ingestion pathway, reducing parsing overhead [^17][^22].

Ingestion recommendation: Use the Morocco tag page for comprehensive lists and subscribe to relevant RSS categories (e.g., Middle-East, Economy) as needed [^17][^22].

### RT Arabic

定位: Arabic-language site with a Morocco tag and a general RSS noted on the site. Morocco-tag feed URL requires verification. Update cadence appears high. The site distributes content through multiple social channels [^20].

Ingestion recommendation: Use the sitewide RSS while verifying Morocco-tag feed specificity. Parse the Morocco tag page if feed parity is insufficient [^20].

### BBC News Arabic

定位: Arabic-language service with a Morocco topic page. Updates are frequent and span politics, society, sports, and culture. RSS/API not surfaced in extracted content [^14].

Ingestion recommendation: Parse the Morocco topic page with pagination; schedule regular polling to capture continuous updates [^14].

### Anadolu Agency (AA)

定位: Turkish state news agency with coverage of Morocco and a dedicated Morocco office. The site is primarily English; Arabic-specific endpoints were not surfaced in extracted content. RSS/API details require further verification [^15][^16].

Ingestion recommendation: Use site search and categories for Morocco coverage; monitor for press materials documenting feed or data access methods for the Morocco bureau [^15][^16].

## RSS Feeds, APIs, and Content Scraping Assessment

RSS/API availability varies significantly across sources. Where RSS is absent, sitemaps and structured HTML listings are viable alternatives. Third-party aggregators can suggest candidates, but verification on official endpoints is essential.

Table 2. RSS/API availability matrix by outlet

| Outlet                         | RSS Confirmed | RSS URL (Ref)   | Public API | Sitemap Confirmed | Notes                                                                 |
|-------------------------------|---------------|-----------------|------------|-------------------|-----------------------------------------------------------------------|
| L’Économiste                  | Yes (via sitemap) | [^23]        | No         | Yes               | Use sitemap index for discovery                                       |
| Al Jazeera Arabic             | Yes           | [^21]          | No         | Not confirmed     | Morocco-only RSS not surfaced                                         |
| Arab News                     | Yes           | [^22]          | No         | Not confirmed     | Category-level RSS available                                          |
| RT Arabic                     | Yes (sitewide) | [^20]         | No         | Not confirmed     | Morocco-tag feed URL needs verification                               |
| Médias24                      | Not surfaced  | —               | No         | Not confirmed     | No RSS/API; dataset portals available                                 |
| Aujourd’hui le Maroc          | Not surfaced  | —               | No         | Not confirmed     | Category/archive parsing                                              |
| H24info                       | Not surfaced  | —               | No         | Not confirmed     | Category/“Le Flash” parsing                                           |
| LesEco.ma / Les Inspirations Éco | Not surfaced | —              | No         | Not confirmed     | WP indicators suggest standard sitemaps                               |
| Le360                         | Not surfaced  | —               | No         | Not confirmed     | French/Arabic versions; server-rendered HTML                          |
| Hespress                      | Not surfaced  | —               | No         | Not confirmed     | English landing; parse “latest” and categories                        |
| Al Arabiya (English site)     | Not surfaced  | —               | No         | Yes               | Use sitemap and Morocco location page                                 |
| BBC News Arabic               | Not surfaced  | —               | No         | Not confirmed     | Topic page with pagination                                            |
| Anadolu Agency                | Not surfaced  | —               | No         | Not confirmed     | Morocco office press; verify endpoints                                |

Scraping feasibility is generally favorable for Moroccan sites, as article listings and archives are server-rendered. While some dynamic elements exist (ads, lazy-loading images), structured parsing remains practical. Table 3 summarizes scraping considerations.

Table 3. Scraping feasibility checklist by outlet

| Outlet                         | Dynamic Elements | Pagination | Sitemaps | Content Paywalls | Robots Notes | Recommended Parsing Strategy                                      |
|-------------------------------|------------------|-----------|----------|------------------|--------------|-------------------------------------------------------------------|
| L’Économiste                  | Moderate         | Yes       | Yes      | No               | Unclear      | Parse sitemap index; category pages for flash/featured updates    |
| Médias24                      | Moderate         | Yes       | Unclear  | No               | Unclear      | Parse categories; ingest dataset portals (legal/tenders/finance)  |
| Aujourd’hui le Maroc          | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Parse category and archive pages; align daily polling             |
| H24info                       | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Parse category and “Le Flash” with timestamp deltas               |
| LesEco.ma / Les Inspirations Éco | Low–Moderate  | Yes       | Likely WP | Premium sections | Unclear      | Explore WP sitemaps; parse categories/tags; respect premium walls |
| Le360                         | Moderate         | Yes       | Unclear  | No               | Unclear      | Parse French/Arabic variants; filter ad tags; timestamp deltas    |
| Hespress                      | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Parse “latest” and categories; language-tag items                 |
| Al Jazeera Arabic             | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Parse Morocco section; supplement with general RSS                |
| Al Arabiya (English site)     | Low–Moderate     | Yes       | Yes      | No               | Unclear      | Use sitemap; parse Morocco location page                          |
| Arab News                     | Low              | Yes       | Unclear  | No               | Unclear      | Prefer RSS; tag page for coverage parity                          |
| RT Arabic                     | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Use sitewide RSS; verify Morocco-tag specificity                  |
| BBC News Arabic               | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Parse Morocco topic page with pagination                          |
| Anadolu Agency                | Low–Moderate     | Yes       | Unclear  | No               | Unclear      | Site search and categories; monitor press for endpoints           |

Table 4. Confirmed feed and category mapping

| Outlet           | Feed/Category                            | Notes                                                     |
|------------------|------------------------------------------|-----------------------------------------------------------|
| Arab News        | RSS catalog: frontpage, Middle-East, Economy, Sports, Life & Style | Subscribe to relevant categories; Morocco tag via page parsing [^22] |
| Al Jazeera Arabic| General RSS                               | Morocco section page for dedicated coverage [^21][^13]   |
| RT Arabic        | RSS (sitewide)                            | Morocco-tag feed URL needs verification [^20]             |
| L’Économiste     | Sitemap index                             | Use for comprehensive article discovery [^23]             |

Aggregators such as Feedspot curate Morocco news feed lists, but access can be blocked or unreliable. Any candidate feeds discovered via aggregators should be validated against official endpoints before production use [^29].

## Update Frequency and Content Structure

All profiled sources update daily, with many posting multiple items throughout the day. Moroccan business outlets demonstrate strong day-to-day cadence, while pan-Arab and international sites maintain continuous coverage of Morocco-related developments.

Table 5. Observed update cadence by outlet

| Outlet                         | Frequency                | Typical Sections                          |
|--------------------------------|--------------------------|-------------------------------------------|
| Médias24                       | Very frequent (daily)    | Économie, Business, Nation, Dataset portals |
| L’Économiste                   | High (daily)             | Flash Info, À la une, Dossiers, Vidéos     |
| Aujourd’hui le Maroc           | Daily                    | Politique, Société, Économie, Culture      |
| H24info                        | High (daily; multiple/day)| Le Flash, Maroc, Économie, Monde           |
| LesEco.ma / Les Inspirations Éco | Daily                   | Maroc, Éco-Business, Opinions, Dossiers     |
| Le360                          | High (daily; multiple/day)| News, Vidéos, Opinion, Most read           |
| Hespress                       | High (daily; multiple/day)| Politics, Economy, Society, Sports         |
| Al Jazeera Arabic              | Multiple daily           | Morocco section; news, in-depth            |
| Al Arabiya (English site)      | Daily                    | Morocco location; North Africa, World      |
| Arab News                      | High (daily)             | Morocco tag; business, Middle-East         |
| RT Arabic                      | High (daily)             | Morocco tag; regional and world news       |
| BBC News Arabic                | High (daily)             | Morocco topic page                         |

Site structures generally present as server-rendered lists with timestamps and category tags, which are amenable to HTML parsing. Special content formats include videos, dossiers, flipbook-style archives (e.g., L’Économiste), and infographics or interactives in international outlets [^3][^1][^13].

## Access Methods and Implementation Guidance

When feeds or APIs are available, RSS ingestion is preferred for stability and lower maintenance overhead. Where unavailable, sitemaps and structured HTML parsing are the primary alternatives. Supplemental signals—newsletters, social channels, and internal dashboards—can enhance coverage and timeliness, provided usage aligns with site policies.

Table 6. Access method matrix by outlet

| Outlet                         | Primary Access Method            | Secondary Signals                         | Notes                                                             |
|--------------------------------|----------------------------------|-------------------------------------------|-------------------------------------------------------------------|
| Arab News                      | RSS                              | Tag page                                  | Prefer RSS for reliability; tag page for parity [^22][^17]        |
| Al Jazeera Arabic              | RSS + Morocco section            | Section pagination                         | Use general RSS and section parsing [^21][^13]                    |
| RT Arabic                      | Sitewide RSS                     | Morocco tag                                | Verify Morocco-tag specificity; supplement with tag page [^20]    |
| L’Économiste                   | Sitemap                          | Flash/top stories                          | Leverage sitemap index for discovery [^23]                        |
| Médias24                       | HTML parsing + datasets          | Newsletter; En ce moment                   | Integrate legal/tender/finance datasets [^1][^25][^26][^27][^28]  |
| Aujourd’hui le Maroc           | HTML parsing                     | Newsletter; subscription                    | Category/archive parsing; align daily polling [^4][^24]           |
| H24info                        | HTML parsing                     | Newsletter                                 | Parse “Le Flash”; use timestamp deltas [^5]                       |
| LesEco.ma / Les Inspirations Éco | HTML + WP sitemaps             | Subscriber content                          | Respect premium walls; parse categories/tags [^6][^8]             |
| Le360                          | HTML parsing                     | Newsletter; apps                            | Consider French/Arabic variants and ad filtering [^7]             |
| Hespress                       | HTML parsing                     | Social channels                             | Parse “latest” and categories; language-tag items [^12]           |
| Al Arabiya (English site)      | Sitemap + HTML                   | Newsletter                                  | Use sitemap and location page [^18]                               |
| BBC News Arabic                | HTML parsing                     | Topic pagination                            | Parse Morocco topic page; regular polling [^14]                   |
| Anadolu Agency                 | HTML parsing                     | Press office materials                      | Site search/categories; monitor press for endpoints [^15][^16]    |

Respect robots.txt and terms of service, and implement conservative polling intervals aligned to observed cadences. For subscriber-only sections (e.g., premium content at LesEco.ma), ensure access controls and compliance.

## Output Deliverable and File Organization Plan

The final deliverable will consolidate:
- URL, language, content types, and update frequency for each outlet.
- Confirmed RSS/API endpoints, sitemaps, and scraping strategy.
- Any special datasets (e.g., legal announcements, tenders, dashboards).
- A categorized summary: major Moroccan outlets; Arabic/international outlets covering Morocco.

Maintain precise citation to official pages and direct endpoints, and clearly flag verification needs where feeds are not confirmed [^31].

## Appendix: Outlet Profiles and Data Points

### Outlet profiles (concise)

- Médias24: Business-first portal with dashboards and datasets (legal announcements, tenders, financial communications). Frequent updates across economy and society categories. No public RSS/API; structured datasets present [^1][^2][^25][^26][^27][^28].
- L’Économiste: French business daily with clear sections and a verified sitemap index. “Flash Info” suggests frequent breaking updates. RSS not surfaced; rely on sitemap [^3][^23].
- Aujourd’hui le Maroc: French general news with broad categories. Daily updates; subscriptions available. No public RSS/API; parse categories/archives [^4][^24].
- H24info: French general news with “Le Flash” and high-frequency updates. No public RSS/API; category and subcategory parsing [^5].
- LesEco.ma / Les Inspirations Éco: French/English versions, business focus. WordPress indicators; premium content. No public RSS/API surfaced; parse categories/tags; explore WP sitemaps [^6][^8].
- Le360: French and Arabic versions, plus regional editions. Frequent updates; ad-delivery mechanisms present. No public RSS/API; server-rendered HTML parsing [^7].
- Hespress: English landing portal for international audience; Arabic portal available. Frequent updates; no public RSS/API surfaced; parse categories and “latest” [^12].
- Al Jazeera Arabic: Dedicated Morocco section within Arabic hub. Multiple daily updates. General RSS available; Morocco-only feed not surfaced [^13][^21].
- Al Arabiya (English): Morocco location page within multi-language site. Sitemap present; RSS not surfaced; parse location page [^18].
- Arab News: English outlet with Morocco tag and RSS catalog. Prefer RSS; use tag page for completeness [^17][^22].
- RT Arabic: Morocco tag and sitewide RSS. Verify Morocco-tag feed specificity; high update cadence [^20].
- BBC News Arabic: Morocco topic page; frequent updates; no RSS/API surfaced [^14].
- Anadolu Agency: Coverage of Morocco; Morocco office inaugurated; English site. RSS/API not surfaced; verify endpoints [^15][^16].

### Moroccan datasets and special sections

Table 7. Datasets and structured sections

| Dataset/Section                          | Outlet       | Reference | Content Type                   | Update Pattern                |
|------------------------------------------|--------------|-----------|--------------------------------|-------------------------------|
| Dashboard portal (e.g., COVID-19)        | Médias24     | [^25]     | Structured metrics/dashboards  | Periodic; event-driven        |
| Annonces légales                         | Médias24     | [^26]     | Legal notices                  | Frequent; structured entries  |
| Annonces judiciaires                     | Médias24     | [^27]     | Judicial notices               | Frequent; structured entries  |
| Appels d’offres                          | Médias24     | [^28]     | Tenders                        | Frequent; structured listings |
| Communication financière                 | Médias24     | [^2]      | Financial communications       | Frequent; corporate releases  |
| Flipbook-style archives / Weekly dossiers| L’Économiste | [^3]      | Digital paper and dossiers     | Periodic                      |

## Information Gaps and Follow-Up

The following gaps require further verification:
- Explicit RSS feed URLs for LesEco.ma, H24info, Aujourd’hui, and Hespress (not surfaced; WP/sitemap exploration advised) [^7][^3][^9][^12].
- Public API documentation for Moroccan outlets (not found).
- Morocco-specific RSS feeds for Al Jazeera Arabic (general RSS available; Morocco-only feed not surfaced) [^21][^13].
- RSS/API details for Anadolu Agency Arabic and technical specifics for the Morocco office feed/data access [^15][^16].
- Verification of any feed endpoints on Le360 (French and Arabic) and updated technical access methods [^10][^11].
- Aggregator claims (e.g., Feedspot list of Morocco feeds) require validation against official endpoints before production use [^29].

## References

[^1]: Médias24 – Portal. https://medias24.com/
[^2]: Médias24 – Communication financière. https://medias24.com/communications/
[^3]: L’Économiste – Le premier quotidien économique du Maroc. https://www.leconomiste.com/
[^4]: Aujourd’hui le Maroc – Online newspaper. https://aujourdhui.ma/
[^5]: H24info – French news portal. https://h24info.ma/
[^6]: LesEco.ma – News portal. https://leseco.ma/
[^7]: Le360 – French site. https://fr.le360.ma/
[^8]: LesEco.ma – English version. https://leseco.ma/english-version
[^9]: Hespress – English portal. https://en.hespress.com/
[^10]: Le360 – Arabic site. https://ar.le360.ma/
[^11]: Le360 – Afrique edition. https://afrique.le360.ma/
[^12]: Hespress – Arabic site. https://www.hespress.com/
[^13]: Al Jazeera Net – Morocco section (Arabic). https://www.aljazeera.net/where/mideast/arab/morocco/
[^14]: BBC News Arabic – Morocco topic page. https://www.bbc.com/arabic/topics/cyx5kw73ygjt
[^15]: Anadolu Agency – Homepage. https://www.aa.com.tr/
[^16]: Anadolu Agency – Morocco office inauguration. https://www.aa.com.tr/en/turkey/anadolu-agency-inaugurates-morocco-office/234727
[^17]: Arab News – Morocco tag page. https://www.arabnews.com/tags/morocco
[^18]: Al Arabiya English – Morocco location page. https://english.alarabiya.net/locations/morocco
[^19]: RT Arabic – Morocco news tag page. https://arabic.rt.com/tags/Morocco-news/
[^20]: RT Arabic – Homepage. https://arabic.rt.com/
[^21]: Al Jazeera Net – RSS. https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9
[^22]: Arab News – RSS. https://www.arabnews.com/rss
[^23]: L’Économiste – Sitemap index. https://www.leconomiste.com/sitemap_index.xml
[^24]: Aujourd’hui le Maroc – Subscription offers. https://aujourdhui.ma/offres-dabonnements
[^25]: Médias24 – Dashboard portal. https://dash.medias24.com/
[^26]: Médias24 – Annonces légales. https://annonceslegales.medias24.com/
[^27]: Médias24 – Annonces judiciaires. https://annoncesjudiciaires.medias24.com/
[^28]: Médias24 – Appels d’offres. https://medias24.com/appelsoffres/
[^29]: Feedspot – Top Morocco News RSS feeds. https://rss.feedspot.com/morocco_news_rss_feeds/
[^30]: BBC News – Morocco media guide. https://www.bbc.com/news/world-africa-14123019
[^31]: Reuters Institute – Digital News Report 2024: Morocco. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024/morocco
[^32]: Reuters Institute – Digital News Report 2025: Morocco. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/morocco
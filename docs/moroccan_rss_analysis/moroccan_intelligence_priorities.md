# WarTracker24 Morocco Intelligence Source Prioritization and Real-Time Monitoring Plan (2025)

## Executive Summary

This operational blueprint prioritizes sources and defines the monitoring architecture required to detect, triage, and action Morocco-focused geopolitical events in real time. It translates an extensive source catalog into a layered monitoring model anchored in four intelligence categories—government announcements, security incidents, economic policy, and diplomatic relations—then aligns ingestion pathways, alert thresholds, and scoring integration with the WarTracker24 risk engine.

Top-tier priorities are clear. First, government portals and dataset pages, notably legal and tender datasets, must be monitored continuously because they underpin regulatory change detection and corporate/financial signal extraction. Second, business outlets with verified feeds or sitemaps—L’Économiste and Médias24—provide reliable, high-cadence coverage of policy decisions and macro developments. Third, pan-Arab and international sources—Al Jazeera Arabic, Arab News, Al Arabiya English, RT Arabic, BBC News Arabic, and Anadolu Agency—add breadth, corroboration, and early alerts from regional vantage points.[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21]

The monitoring approach couples RSS-first ingestion where confirmed (Arab News and Al Jazeera Arabic) with sitemap-first discovery (L’Économiste) and structured HTML parsing for outlets without feeds. This hybrid model is then extended with special dataset integration—Médias24’s legal announcements, judicial announcements, tenders, and financial communications—to enrich geoeconomic monitoring and detect procurement and compliance shifts.[^21][^22][^23][^2][^24][^25][^26][^27][^28]

Alert thresholds are event-category dependent, with breaking triggers tuned to security incidents and diplomatic actions, and escalation triggers tailored to government and economic policy developments. Thresholds map to WarTracker24 fields and scoring dimensions—security, geopolitical, diplomatic, stability, and geoeconomic—so that real-time feeds can lift risk scores, trigger analyst review, and drive alert dispatch.

Operationally, polling frequencies are tiered: Tier-1 government dataset pages are polled every 1–2 minutes, Tier-1RSS sources every 2–3 minutes, Tier-2 HTML category pages every 5–10 minutes, and Tier-3 background sources every 15–30 minutes. Dynamic backoff under load and de-duplication across Arabic/French/English variants are built-in. A QA framework with weekly accuracy and latency reporting, plus an SLA for security/diplomatic alerts, ensures continuous improvement and compliance with publisher terms.

Information gaps remain (e.g., explicit RSS confirmation for several Moroccan outlets, limited public APIs). These are handled through sitemap-first strategies, HTML parsing, and publisher outreach. The plan anticipates these constraints and defines safe, respectful ingestion that aligns with robots.txt and site terms.

## WarTracker24 Context and Objectives

WarTracker24 models geopolitical events through a structured event schema: headline, timestamp, location, category, actors, regions, priority, sentiment, and confidence. Its risk engine aggregates weighted score dimensions—security, geopolitical, diplomatic, stability, and geoeconomic—then modulates aggregate risk using modifiers for priority, sentiment, confidence, and regional spread. The system supports analytical workflows from ingestion through triage and executive summarization.

The monitoring objective is to feed this engine with real-time signals that elevate risk appropriately and promptly. For Morocco, the priority categories are government announcements, security incidents, economic policy, and diplomatic relations. Target outcomes include: near-zero latency for high-severity security and diplomatic events; rapid detection of regulatory changes through government portals and datasets; high-fidelity coverage of macro shifts via business outlets; and broader regional corroboration through pan-Arab/international sources. Constraints include respect for robots.txt, conservative polling aligned to observed cadences, and careful handling of language variants and premium content.

To anchor field usage, the following table maps WarTracker24 fields to monitoring categories and shows how data flows into scoring.

To illustrate this alignment, Table 1 maps WarTracker24’s fields to the four priority categories and indicates which inputs drive elevated risk scoring and alerts.

### Table 1. WarTracker24 Event Fields to Monitoring Categories Mapping

| WarTracker24 Field | Government Announcements | Security Incidents | Economic Policy | Diplomatic Relations | Role in Scoring |
|--------------------|--------------------------|--------------------|-----------------|----------------------|-----------------|
| headline           | Official notices, decrees | Incident summaries | Policy headlines | Bilateral/multilateral statements | Drives initial triage and keyword filters |
| timestamp          | Publication/update times | First report time  | Announcement time | Statement/release time | Latency measurement and trend direction |
| location.country   | Morocco                  | Morocco            | Morocco         | Morocco or partner capitals | Geo-scope anchoring |
| category           | Government/Regulation    | Security           | Economy         | Diplomacy            | Routes to correct scoring dimensions |
| actors             | Ministries, regulators   | Security agencies, groups | Government, central bank, firms | Government, foreign counterparts | Multi-actor boosts risk modifiers |
| regions            | Morocco, MENA            | Morocco, Sahel/West Africa | Morocco, MENA, global markets | Morocco, MENA, Europe/Africa | Multi-region elevates regionalModifier |
| priority           | High for legal/tenders   | High for attacks/alerts | High for macro/fiscal | High for crises/summits | priorityModifier scales overall risk |
| sentiment          | Neutral to negative      | Negative           | Negative for austerity; positive for growth | Negative for crises; positive for deals | sentimentModifier adjusts risk |
| confidence         | High for official portals| Varies; corroboration needed | High for official stats; medium for commentary | High for wire-level; medium otherwise | confidenceModifier dampens/holds risk |
| scores.security    | Indirect (regulatory risk) | Primary            | Secondary       | Secondary            | Security dimension weighting |
| scores.geopolitical| High for sovereignty issues | Medium             | Medium–High     | High                 | Geopolitical dimension weighting |
| scores.diplomatic  | Medium                   | Medium             | Medium          | Primary              | Diplomatic dimension weighting |
| scores.stability   | High for policy shifts   | High for incidents | High            | High                 | Stability inverted in overall risk |
| scores.geoeconomic | High via tenders/finance | Medium             | High            | Medium               | Geoeconomic dimension weighting |
| source, sourceUrl  | Official portals         | Media, wires       | Business outlets | Wires, government    | Confidence and routing |

This mapping enables precise routing of incoming items into the risk engine and consistent alert logic per category.

## Source Landscape and Evidence Base

Morocco’s media landscape is bilingual (Arabic and French) with strong business coverage in French and a robust pan-Arab layer providing regional context. Feed and API availability vary widely; confirmed RSS exists for Al Jazeera Arabic and Arab News, while L’Économiste exposes a sitemap index. Many Moroccan outlets rely on structured HTML listings, making sitemap discovery and category-page parsing the backbone of ingestion.[^1][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^30][^31][^32][^33]

To ground the intelligence value of each outlet by category, the landscape is summarized below and then detailed in the ingestion feasibility matrix.

Before we define priorities, Table 2 summarizes the landscape by language and relevance to the four categories.

### Table 2. Outlet Landscape Summary by Language and Category Relevance

| Outlet | Language(s) | Government Announcements | Security Incidents | Economic Policy | Diplomatic Relations | Update Cadence | Feed/Sitemap Status |
|--------|-------------|--------------------------|--------------------|-----------------|----------------------|----------------|---------------------|
| Médias24 | French | High (legal, finance datasets) | Medium | High (business/economy) | Medium | Very frequent | No RSS/API; structured datasets |
| L’Économiste | French | High | Medium | High | Medium | High | Sitemap confirmed |
| Aujourd’hui le Maroc | French | Medium | Medium | Medium | Medium | Daily | No RSS/API |
| H24info | French | Medium | High (flash updates) | Medium | Medium | High | No RSS/API |
| LesEco.ma / Les Inspirations Éco | French; English version | Medium | Medium | High | Medium | Daily | No RSS/API; WP indicators |
| Le360 | French; Arabic | Medium | High (multi-domain) | Medium | Medium | High | No RSS/API |
| Hespress | English; Arabic | Medium | High | Medium | Medium | High | No RSS/API |
| Al Jazeera Arabic | Arabic | Medium | High | Medium | High | Multiple daily | RSS confirmed |
| Al Arabiya (English site) | English; Arabic | Medium | Medium | Medium | Medium | Daily | Sitemap present |
| Arab News | English | Medium | Medium | Medium | Medium | High | RSS confirmed |
| RT Arabic | Arabic | Medium | High | Medium | High | High | Sitewide RSS |
| BBC News Arabic | Arabic | Medium | Medium | Medium | Medium | High | No RSS/API |
| Anadolu Agency | English | Medium | Medium | Medium | Medium | High | No RSS/API |

The most reliable ingestion pathways are summarized in Table 3 (feeds, sitemaps, HTML parsing), while scraping feasibility factors—dynamic elements, pagination, paywalls—are detailed in Table 4.

### Table 3. RSS/API Availability Matrix

| Outlet | RSS | Sitemap | Public API | Notes |
|--------|-----|---------|------------|-------|
| L’Économiste | Via sitemap | Yes | No | Use sitemap index |
| Al Jazeera Arabic | Yes | Not confirmed | No | General RSS available |
| Arab News | Yes | Not confirmed | No | Category-level RSS available |
| RT Arabic | Yes (sitewide) | Not confirmed | No | Morocco-tag feed to verify |
| Médias24 | No | Unclear | No | Dataset portals available |
| Aujourd’hui le Maroc | No | Unclear | No | Category/archive parsing |
| H24info | No | Unclear | No | Category and “Le Flash” parsing |
| LesEco.ma / Les Inspirations Éco | No | Likely WP | No | Respect premium walls |
| Le360 | No | Unclear | No | French/Arabic variants |
| Hespress | No | Unclear | No | Category/latest parsing |
| Al Arabiya (English site) | No | Yes | No | Use sitemap and location page |
| BBC News Arabic | No | Unclear | No | Topic page with pagination |
| Anadolu Agency | No | Unclear | No | Monitor press for endpoints |

[^21][^22][^23][^1][^18]

### Table 4. Scraping Feasibility Checklist

| Outlet | Dynamic Elements | Pagination | Content Paywalls | Recommended Strategy |
|--------|------------------|------------|------------------|---------------------|
| L’Économiste | Moderate | Yes | No | Sitemap index; category pages |
| Médias24 | Moderate | Yes | No | Categories; ingest datasets |
| Aujourd’hui le Maroc | Low–Moderate | Yes | No | Category/archive parsing |
| H24info | Low–Moderate | Yes | No | Category; “Le Flash” parsing |
| LesEco.ma | Low–Moderate | Yes | Premium sections | Explore WP sitemaps; respect paywalls |
| Le360 | Moderate | Yes | No | Server-rendered listings; ad filtering |
| Hespress | Low–Moderate | Yes | No | “Latest”; categories; language tagging |
| Al Jazeera Arabic | Low–Moderate | Yes | No | RSS + Morocco section parsing |
| Al Arabiya (English site) | Low–Moderate | Yes | No | Sitemap; location page parsing |
| Arab News | Low | Yes | No | Prefer RSS; tag page for parity |
| RT Arabic | Low–Moderate | Yes | No | Sitewide RSS; verify Morocco tag specificity |
| BBC News Arabic | Low–Moderate | Yes | No | Topic page parsing |
| Anadolu Agency | Low–Moderate | Yes | No | Categories/search; verify endpoints |

### Major Moroccan Outlets (French and Arabic)

Moroccan outlets provide consistent, daily updates with clear structures for categories, archives, and special sections. Business outlets (Médias24 and L’Économiste) anchor economic and regulatory coverage; generalist portals (H24info, Le360, Hespress) offer breadth and speed, often surfacing flash updates. French dominates business coverage, while Arabic and English variants broaden reach.[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12]

To emphasize dataset value for monitoring, Table 5 lists Médias24’s structured datasets and their relevance.

### Table 5. Médias24 Dataset Index and Monitoring Value

| Dataset | Outlet | Monitoring Value | Update Pattern |
|---------|--------|------------------|----------------|
| Dashboard portal | Médias24 | Macro/regional dashboards | Periodic; event-driven |
| Annonces légales | Médias24 | Legal notices; regulatory changes | Frequent; structured |
| Annonces judiciaires | Médias24 | Judicial notices; compliance signals | Frequent; structured |
| Appels d’offres | Médias24 | Procurement opportunities; market access | Frequent; structured listings |
| Communication financière | Médias24 | Corporate disclosures; investor communications | Frequent; structured releases |

[^2][^24][^25][^26][^27][^28]

### Arabic and International Outlets Covering Morocco

Pan-Arab and international sources add regional context, early alerts, and corroboration. Al Jazeera Arabic’s Morocco section and general RSS provide high-frequency coverage; Arab News offers category-level RSS and a Morocco tag; Al Arabiya English maintains a Morocco location page; RT Arabic provides a Morocco tag and sitewide RSS; BBC News Arabic hosts a Morocco topic page; Anadolu Agency covers Morocco with a dedicated bureau. Together, they reinforce breadth and timeliness across security and diplomatic domains.[^13][^14][^15][^16][^17][^18][^19][^20][^21][^22]

## Priority Ranking by Intelligence Value

A four-tier ranking maximizes intelligence value for Morocco-focused monitoring. Tier definitions prioritize government portals/datasets and business outlets with reliable ingestion paths, then extend to generalist outlets and international sources for breadth and corroboration.

- Tier 1: Government portals and datasets; verified RSS (Al Jazeera Arabic, Arab News); L’Économiste via sitemap.
- Tier 2: High-cadence generalist outlets (Médias24, H24info, Le360, Hespress) and Al Arabiya English.
- Tier 3: LesEco.ma and Aujourd’hui le Maroc for structured business/economic policy coverage and broader general news.
- Tier 4: BBC News Arabic, Anadolu Agency for background context and corroboration.

This ranking aligns access methods with reliability and category strengths.

### Table 6. Priority Tier Definitions and Inclusion Criteria

| Tier | Inclusion Criteria | Examples |
|------|--------------------|----------|
| Tier 1 | Government datasets; verified RSS/sitemap; high policy relevance | Médias24 datasets; L’Économiste sitemap; Al Jazeera Arabic RSS; Arab News RSS |
| Tier 2 | High-cadence generalist HTML parsing; regional corroboration | H24info; Le360; Hespress; Al Arabiya English location page |
| Tier 3 | Business outlets with WP indicators; broader policy coverage | LesEco.ma; Aujourd’hui le Maroc |
| Tier 4 | Background context and international corroboration | BBC News Arabic; Anadolu Agency |

### Table 7. Tier-to-Category Relevance Matrix (Indicative)

| Outlet | Government Announcements | Security Incidents | Economic Policy | Diplomatic Relations | Access Method |
|--------|--------------------------|--------------------|-----------------|----------------------|---------------|
| Médias24 datasets | High | Medium | High | Medium | HTML + datasets |
| L’Économiste | High | Medium | High | Medium | Sitemap |
| Al Jazeera Arabic | Medium | High | Medium | High | RSS + section |
| Arab News | Medium | Medium | Medium | Medium | RSS + tag |
| H24info | Medium | High | Medium | Medium | HTML |
| Le360 | Medium | High | Medium | Medium | HTML |
| Hespress | Medium | High | Medium | Medium | HTML |
| Al Arabiya English | Medium | Medium | Medium | Medium | Sitemap + HTML |
| LesEco.ma | Medium | Medium | High | Medium | HTML + WP sitemaps |
| Aujourd’hui le Maroc | Medium | Medium | Medium | Medium | HTML |
| BBC News Arabic | Medium | Medium | Medium | Medium | HTML |
| Anadolu Agency | Medium | Medium | Medium | Medium | HTML |

### Table 8. Outlet-to-Primary Intelligence Category Mapping

| Outlet | Primary Category |
|--------|------------------|
| Médias24 datasets | Government Announcements; Economic Policy |
| L’Économiste | Economic Policy; Government Announcements |
| Al Jazeera Arabic | Diplomatic Relations; Security Incidents |
| Arab News | Economic Policy; Diplomatic Relations |
| H24info | Security Incidents; Government Announcements |
| Le360 | Security Incidents; Diplomatic Relations |
| Hespress | Security Incidents; Government Announcements |
| Al Arabiya English | Diplomatic Relations; Economic Policy |
| LesEco.ma | Economic Policy; Government Announcements |
| Aujourd’hui le Maroc | Government Announcements; Economic Policy |
| BBC News Arabic | Diplomatic Relations; Security Incidents |
| Anadolu Agency | Diplomatic Relations; Security Incidents |

The following outlet-level notes capture rationale and coverage strengths:

### Tier 1 (Highest Intelligence Value)

- Médias24 datasets (annonces légales, judiciaires, appels d’offres, communication financière, dashboards) provide structured signals across government announcements and geoeconomic developments.[^2][^24][^25][^26][^27][^28]
- Al Jazeera Arabic (RSS and Morocco section) offers multiple daily updates with a strong regional lens, ideal for security and diplomatic monitoring.[^13][^21]
- Arab News (RSS catalog and Morocco tag) supplies reliable feed ingestion and category-level coverage including Middle-East and Economy, useful for policy and diplomatic cues.[^17][^22]
- L’Économiste (sitemap) is a French business daily with a verified sitemap index, enabling comprehensive discovery of policy-relevant articles and flash updates.[^3][^23]

### Tier 2 (High Cadence and Regional Context)

- H24info (French, “Le Flash”) and Le360 (French/Arabic) are high-frequency generalist outlets with category breadth and rapid updates suitable for security incidents and public statements.[^5][^7][^10][^11]
- Hespress (English/Arabic) offers multi-language breadth across politics, economy, and society, helpful for corroboration and language tagging in alerts.[^8][^12]
- Al Arabiya English (Morocco location page and sitemap) provides regional perspective across North Africa and World, supporting diplomatic and economic monitoring.[^18]

### Tier 3 (Structured Economic Coverage and Broader Policy Coverage)

- LesEco.ma and Les Inspirations Éco (French with English version; WordPress indicators) provide business/economic dossiers and legal announcements; premium content should be handled with access controls.[^6][^8]
- Aujourd’hui le Maroc offers general news in French with category breadth; subscription signals can enhance ingestion context.[^4][^24]

### Tier 4 (Background Context and Corroboration)

- BBC News Arabic provides depth and balanced coverage across Morocco topics; parsing the topic page supports regular updates.[^14]
- Anadolu Agency adds international wire-style coverage and a Morocco bureau, useful for corroboration and potential endpoint discovery via press materials.[^15][^16]

## Content Filtering Criteria for Geopolitical Relevance

Filtering must be precise, multilingual, and category-aware. The criteria below ensure alignment with WarTracker24’s scoring while minimizing false positives.

Keywords should reflect event semantics in Arabic, French, and English. Entities must include ministries, agencies, regulatory bodies, and key economic actors. Geo-scoping should prioritize Morocco and adjacent regions where spillover risk exists. Categories must route content to appropriate scoring dimensions.

To make this actionable, Table 9 enumerates category-specific keyword/phrase lists and entity names.

### Table 9. Category-Specific Keyword/Phrase Lists and Entities (Arabic, French, English)

| Category | Arabic Keywords | French Keywords | English Keywords | Entities |
|----------|-----------------|-----------------|------------------|----------|
| Government Announcements | مرسوم; قانون; وزارة;的新型 | décret; loi; ministère; communiqué; arrêté | decree; law; ministry; gazette; notice | Government of Morocco; Ministry of Economy and Finance; Ministry of the Interior; High Authority for Audiovisual Communication; civil service departments |
| Security Incidents | هجوم; اعتداء; عمليات; الأمن;警察 | attaque; attentat; sécurité; forces de l’ordre; incident | attack; incident; security; police; troops | Moroccan security agencies; Gendarmerie Royale; police forces; local prefecture authorities |
| Economic Policy | ميزانية; fiscal; بنك مركزي;ضرائب | budget; politique monétaire; fiscalité; banque centrale; réforme | budget; monetary policy; tax; central bank; reform | Bank Al-Maghrib; Ministry of Economy and Finance; capital markets regulator; competition council |
| Diplomatic Relations | قمة; اتفاق; علاقات; زيارة رسمية | sommet; accord; relations diplomatiques; visite officielle | summit; agreement; diplomatic relations; official visit | Government of Morocco; foreign ministries; EU institutions; African Union; bilateral partners |

These filters should be implemented as token sets per category, with language-aware normalization. Location normalization must map variant names (e.g., Rabat/Rabat-Salé-Kénitra) and avoid spurious geo-matches (e.g., “Morocco, Missouri”). Category routing maps item tags to the correct WarTracker24 dimension for scoring.

### Table 10. Geo-Entity Mapping (Morocco Regions and Adjacent Spillover Zones)

| Geo-Entity | Notes |
|------------|-------|
| Morocco (national) | Default geo scope for all categories |
| Rabat-Salé-Kénitra | Capital region; key government announcements |
| Casablanca-Settat | Financial hub; market-sensitive policy/economic coverage |
| Marrakech-Safi | Tourist and logistics region; incident spillover considerations |
| Fes-Meknes | Industrial and academic center; public order items |
| Tangier-Tetouan-Al Hoceima | Ports and logistics; strategic infrastructure |
| Southern provinces (Laayoune-Boujdour-Sakia El Hamra; Dakhla-Oued Ed-Dahab) | Sovereignty and geopolitical sensitivity |
| Sahel/West Africa neighboring states (Mali, Niger, Burkina Faso) | Spillover risk for security incidents |
| Ceuta/Melilla (Spanish enclaves) | Border sensitive topics; potential diplomatic friction |
| EU Mediterranean partners (Spain, France) | Diplomatic relations and migration routes |

Normalization rules should handle language variants, common aliases, and diacritics (e.g., Marrakech/Marrakesh; El Hoceima/Al Hoceima). False-positive mitigation includes negative keyword lists (e.g., sports results or entertainment items without policy/security relevance) and entity co-occurrence checks.

## Alert Thresholds Requiring Immediate Attention

Alert thresholds must be strict enough to avoid noise but sensitive enough to capture material events. The triggers differ by category; multiple signals should be required for escalation.

To operationalize this, Table 11 enumerates triggers and actions, including WarTracker24 field mapping. These thresholds should be enforced at ingestion and reinforced by deduplication and language corroboration.

### Table 11. Category-Specific Alert Triggers and Actions

| Category | Trigger | Threshold Examples | WarTracker24 Field Impact | Action |
|----------|---------|--------------------|---------------------------|--------|
| Security Incidents | Immediate alert | Attack, explosion, or security operation reported by Tier-1 or Tier-2 source; mention of casualties; official statements by security agencies | sentiment=negative; priority=high; scores.security≥80; regionalModifier if multi-region | Instant analyst notification; cross-source corroboration; send alert |
| Diplomatic Relations | Immediate alert | Bilateral/multilateral summit announcements; treaty signings; diplomatic crises or expulsions; border closures | priority=high; scores.diplomatic≥80; actors include foreign counterparts | Analyst notification; update diplomatic timeline; alert stakeholders |
| Government Announcements | Immediate alert | Publication of new decrees, laws, legal/tender datasets (e.g., nouvelles annonces) affecting regulatory environment | priority=high if macro impact; scores.geoeconomic≥70; scores.geopolitical≥60 | Alert compliance/regulatory teams; ingest dataset items; note effective dates |
| Economic Policy | Immediate alert | Central bank decisions; budget announcements; major fiscal/reform packages; market-moving statements | priority=high; scores.geoeconomic≥75; scores.geopolitical≥65 | Alert economic analysts; flag macro indicators; cross-verify with business outlets |
| Escalation (cross-category) | Escalation | Two or more Tier-1/Tier-2 sources report; sentiment remains negative; trend direction escalating | confidence=medium→high as corroboration accumulates; riskScore elevated | Upgrade priority; widen alert distribution; request deep-dive |

Severity bands—LOW/MEDIUM/HIGH/CRITICAL—should map to aggregate risk score thresholds, where CRITICAL aligns with multi-source corroboration and sustained negative sentiment. De-duplication across Arabic/French/English variants should treat near-identical reports as a single event with multi-language attachments.

## Integration Points with WarTracker24 Risk Assessment

Real-time monitoring must integrate with WarTracker24’s scoring model and event schema. The risk engine applies weights—security 0.35, geopolitical 0.25, diplomatic 0.20, stability 0.15, and geoeconomic 0.05—then adjusts overall risk through modifiers for priority, sentiment, confidence, and regional spread. The monitoring feeds should populate the relevant fields and inform these modifiers.

The mapping in Table 12 shows how ingestion sources contribute to each dimension.

### Table 12. Source-to-Risk Dimension Mapping and Suggested Weights

| Ingestion Source | security | geopolitical | diplomatic | stability | geoeconomic |
|------------------|----------|--------------|------------|-----------|-------------|
| Government datasets (legal/tenders/finance) | Medium | Medium–High | Medium | High | High |
| L’Économiste (policy/business) | Medium | High | Medium | High | High |
| Al Jazeera Arabic (regional lens) | High | High | High | High | Medium |
| Arab News (RSS categories) | Medium | Medium–High | Medium | High | Medium–High |
| Al Arabiya English (location page) | Medium | High | High | Medium–High | Medium |
| H24info / Le360 / Hespress | High | Medium | Medium–High | Medium–High | Medium |
| BBC News Arabic | Medium | High | High | Medium | Medium |
| Anadolu Agency | Medium | Medium–High | High | Medium | Medium |

Table 13 maps event schema fields to WarTracker24 for consistent ingestion behavior.

### Table 13. Event Schema Fields to WarTracker24 Fields Mapping

| Event Schema Field | WarTracker24 Field | Notes |
|--------------------|--------------------|-------|
| title/headline | headline | Normalized capitalization; language-tagged |
| published_at | timestamp | UTC normalization; latency tracking |
| location.geo | location.country, regions | Morocco and spillover regions |
| category | category | Government/Security/Economy/Diplomacy |
| actors | actors | Government ministries, agencies, partners |
| language | N/A (metadata) | Arabic/French/English detection |
| source_name | source | Outlet identification |
| source_url | sourceUrl | Canonical article link |
| priority | priority | Derived from trigger rules |
| sentiment | sentiment | Language-aware classification |
| confidence | confidence | Source tier + cross-corroboration count |
| body | description | Snippet for executive summaries |

Overall risk calculation should mirror WarTracker24 logic: aggregate weighted scores, then apply modifiers—priority (high=1.15), sentiment (negative=1.2), confidence (medium=0.95), regional spread (multi-region=1.1). The UI components expect these fields and modifiers; integrating them ensures consistency from ingestion through analyst review.

## Recommended Polling Frequencies by Priority Tier

Polling must balance timeliness against server load and publisher terms. Tier-based schedules reflect observed update cadences, with dynamic backoff during low activity and burst mode on emerging spikes. Costs should be managed through RSS-first and sitemap-first strategies, with HTML parsing only where necessary.

Table 14 outlines suggested polling intervals by outlet tier, followed by a daily cadence plan.

### Table 14. Polling Frequency Recommendations by Outlet/Tier

| Outlet Tier | Recommended Polling | Rationale |
|-------------|---------------------|-----------|
| Tier-1 government dataset pages | 1–2 minutes | Continuous updates; tender/legal notices |
| Tier-1 RSS (Al Jazeera Arabic; Arab News) | 2–3 minutes | Multiple daily updates; reliability of feeds |
| Tier-1 sitemap (L’Économiste) | 2–3 minutes | Comprehensive discovery; flash updates |
| Tier-2 HTML category/latest pages | 5–10 minutes | High cadence; structured listings |
| Tier-3 HTML category/archive pages | 10–15 minutes | Daily coverage; stable cadence |
| Tier-4 background sources | 15–30 minutes | Corroboration and context |

### Table 15. Daily Polling Cadence Plan by Source Type

| Source Type | Peak Hours | Off-Peak | Notes |
|-------------|------------|----------|-------|
| RSS feeds | 2–3 min | 5 min | Burst to 1–2 min on major events |
| Sitemaps | 2–3 min | 5–10 min | Frequent recrawls for new items |
| HTML categories | 5–10 min | 10–15 min | Delta parsing via timestamps |
| Dataset portals | 1–2 min | 3–5 min | Watch for new entries and updates |

Operational safeguards should include exponential backoff on errors, robots.txt adherence, and staggered schedules across similar sources to avoid synchronized spikes.

## Operationalization: Ingestion, QA, and SLA

A robust operating model spans ingestion, normalization, QA, and SLA enforcement. The pipeline should apply the following sequence:

1. Ingestion: Pull from RSS/sitemaps; parse HTML categories; monitor dataset portals.
2. Normalization: Deduplicate multi-language variants; normalize entities and locations; tag languages.
3. Enrichment: Classify category; assign sentiment; populate actors and regions.
4. Scoring: Map to dimensions and modifiers; compute overall risk.
5. Alerting: Evaluate thresholds; route alerts by category and severity.
6. Review: Queue for analyst triage; generate executive summaries.
7. Audit: Log latency, accuracy, and alert outcomes for continuous improvement.

Table 16 codifies QA checks and SLA targets per category.

### Table 16. QA Checklist and SLA Targets

| Category | Accuracy Check | Latency Target | Escalation SLA | Notes |
|----------|----------------|----------------|----------------|-------|
| Security Incidents | Cross-source corroboration (≥2 Tier-1/2 sources) | ≤3 minutes | Immediate analyst page; executive brief within 30 minutes | Suppress duplicates; maintain language tags |
| Diplomatic Relations | Official statement verification | ≤5 minutes | Analyst notification; stakeholder alert within 45 minutes | Track bilateral timeline and changes |
| Government Announcements | Dataset entry and legal notice confirmation | ≤5 minutes | Regulatory/compliance teams notified within 60 minutes | Effective date capture; dataset item tagging |
| Economic Policy | Official release and business outlet corroboration | ≤5 minutes | Economic team alert; market impact note within 60 minutes | Central bank and budget cycle emphasis |

Compliance requires respect for robots.txt and publisher terms, conservative polling, and careful handling of premium content walls (e.g., at LesEco.ma). Aggregator claims should be validated against official endpoints before production use.[^33]

## Appendices

The appendices consolidate endpoint availability and datasets to facilitate implementation and reviews.

### Table 17. RSS/Sitemap/API Availability Matrix (Consolidated)

| Outlet | RSS | Sitemap | Public API | Notes |
|--------|-----|---------|------------|-------|
| L’Économiste | Via sitemap | Yes | No | Sitemap index |
| Al Jazeera Arabic | Yes | Not confirmed | No | General RSS |
| Arab News | Yes | Not confirmed | No | Category-level RSS |
| RT Arabic | Yes | Not confirmed | No | Sitewide RSS |
| Médias24 | No | Unclear | No | Dataset portals |
| Aujourd’hui le Maroc | No | Unclear | No | Category/archive |
| H24info | No | Unclear | No | Category/flash |
| LesEco.ma | No | Likely WP | No | Premium content |
| Le360 | No | Unclear | No | French/Arabic |
| Hespress | No | Unclear | No | Latest/categories |
| Al Arabiya (English) | No | Yes | No | Sitemap + location page |
| BBC News Arabic | No | Unclear | No | Topic page |
| Anadolu Agency | No | Unclear | No | Monitor press |

### Table 18. Dataset and Structured Sections Index

| Dataset/Section | Outlet | Update Pattern | Monitoring Value |
|-----------------|--------|----------------|------------------|
| Dashboard portal | Médias24 | Periodic; event-driven | Macro indicators |
| Annonces légales | Médias24 | Frequent; structured | Regulatory changes |
| Annonces judiciaires | Médias24 | Frequent; structured | Judicial signals |
| Appels d’offres | Médias24 | Frequent; structured | Procurement and market access |
| Communication financière | Médias24 | Frequent; structured | Corporate disclosures |
| Sitemap index | L’Économiste | Frequent | Article discovery |
| Morocco section | Al Jazeera Arabic | Multiple daily | Security/diplomatic updates |
| Morocco tag | Arab News | High | Policy/diplomacy context |
| Morocco location page | Al Arabiya English | Daily | Regional corroboration |
| Morocco topic page | BBC News Arabic | High | Balanced background |
| Morocco office press | Anadolu Agency | Irregular | Potential endpoints |

### Information Gaps and Next Steps

Information gaps require resolution to optimize ingestion. Explicit RSS feed URLs for LesEco.ma, H24info, Aujourd’hui le Maroc, and Hespress are not surfaced; Moroccan outlets do not expose public APIs; Morocco-specific feeds for Al Jazeera Arabic and RT Arabic need verification; and Le360 feed endpoints should be checked. Aggregator claims should be validated against official endpoints before production use. Steps include: systematic sitemap discovery across Arabic and French variants; category-page parsing; publisher outreach for documented endpoints; and internal feed catalogs maintained by tier.

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
[^24]: Médias24 – Dashboard portal. https://dash.medias24.com/
[^25]: Médias24 – Annonces légales. https://annonceslegales.medias24.com/
[^26]: Médias24 – Annonces judiciaires. https://annoncesjudiciaires.medias24.com/
[^27]: Médias24 – Appels d’offres. https://medias24.com/appelsoffres/
[^28]: Aujourd’hui le Maroc – Subscription offers. https://aujourdhui.ma/offres-dabonnements
[^29]: Feedspot – Top Morocco News RSS feeds. https://rss.feedspot.com/morocco_news_rss_feeds/
[^30]: BBC News – Morocco media guide. https://www.bbc.com/news/world-africa-14123019
[^31]: Reuters Institute – Digital News Report 2024: Morocco. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024/morocco
[^32]: Reuters Institute – Digital News Report 2025: Morocco. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/morocco
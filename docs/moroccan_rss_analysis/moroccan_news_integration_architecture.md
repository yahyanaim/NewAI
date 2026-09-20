# Moroccan News-to-IntelEvent Integration Architecture for WarTracker24

## Executive Summary

WarTracker24’s intelligence workflows depend on structured, deduplicated, and timely event records that analyst teams can trust, filter, and act upon. This blueprint specifies a production-grade architecture to convert Moroccan news articles into IntelEvent-compatible records, fully compatible with LiveSignalsFeed and AIAssessmentPanel. It defines the end-to-end transformation pipeline—from ingestion through normalization, content analysis, scoring, deduplication, and UI integration—alongside implementation details, QA practices, and operational guardrails.

The design aligns with the system’s existing UI behaviors: LiveSignalsFeed filters by sentiment, priority, and free text, refreshes every three seconds, and displays key event metadata through EventCard. The AIAssessmentPanel consumes the enriched IntelEvent structure to compute risk, severity, and trend, and to produce executive summaries and Markdown exports for downstream sharing. By grounding extraction and scoring logic in the components’ current usage patterns, the architecture ensures that newly converted Moroccan events render consistently, are indistinguishable from existing signals, and benefit from the same analytical surfaces and controls.

Deliverables include:
- An end-to-end pipeline specification: fetch → parse → normalize → analyze → score → dedupe → persist → publish → UI render.
- A canonical IntelEvent schema aligned with the existing codebase’s fields, enumerations, and defaults.
- A mapping strategy that translates article metadata (e.g., title, body, source) into IntelEvent, including confidence assignments and provenance.
- An extraction taxonomy for locations, actors, regions, risk indicators, and geopolitical relevance calibrated for Moroccan contexts.
- A categorization framework consistent with current usage (e.g., political, military, economic, diplomatic; extendable to Politics, Economy, Security, Society).
- A priority scoring model that drives UI priority chips and downstream risk computations.
- Timestamp normalization and deduplication strategies that integrate with the three-second refresh cadence and UI behavior.
- Integration points with LiveSignalsFeed and AIAssessmentPanel, including contract expectations and display logic.
- Operational, QA, security, and extensibility guidelines for ongoing reliability and evolution.

This architecture minimizes information loss across the pipeline by preferring early structurization, explicit confidence tagging, and traceable normalization decisions. It prioritizes UI compatibility, maintainability, and safe-by-default behaviors—particularly for deduplication and priority escalation—so that new Moroccan signals slot seamlessly into existing workflows without introducing instability or false positives.

Information gaps are acknowledged where relevant—namely the absence of formal IntelEvent TypeScript type definitions and full score initialization logic—along with practical workarounds that maintain compatibility with the current UI.

## Objectives and Success Criteria

The primary objective is to transform Moroccan news articles into IntelEvent records that the WarTracker24 UI can display and analyze without modification. This requires field-level compatibility with LiveSignalsFeed and AIAssessmentPanel, and consistency with their display rules and filtering semantics.

Success criteria:
- Completeness of field mapping: every article yields all required IntelEvent fields expected by the UI, with optional fields populated when derivable.
- Extraction fidelity: locations, actors, regions, risk indicators, and geopolitical relevance are identified with confidence levels and Moroccan contextual calibration.
- Category and sentiment alignment: categories adhere to current enumerations and extend naturally; sentiment follows the UI’s three-state model.
- Priority accuracy and stability: score-to-priority mappings are consistent and stable under the three-second refresh cadence; unnecessary flips are minimized.
- Dedup efficacy: near-duplicates within sliding windows are resolved, with tie-breakers that preserve the highest-confidence record.
- UI filter coherence: new events respect filter semantics (sentiment, priority, search) and render correctly in EventCard and the assessment panel.

Assumptions:
- An ingestion layer retrieves Moroccan articles from defined sources with fields including at least title, body, published date, and source name.
- An enrichment layer can leverage NLP services for NER (named entity recognition), geocoding, classification, and sentiment analysis.
- The system can persist structured records and publish deltas to the UI on a low-latency feed.

Constraints:
- Unknowns include the definitive IntelEvent TypeScript type definition and the complete score initialization logic for UI rendering. The architecture therefore uses component usage patterns and field access to infer the contract and relies on a compatibility shim where necessary.

## IntelEvent Data Structure Mapping for News Articles

The IntelEvent structure observed in the UI components includes the following fields: id; timestamp; headline; description; sentiment (positive, negative, neutral); priority (high, normal, low); location (lat, lng, country, region); source; sourceUrl; category (e.g., political, military, economic, diplomatic); actors; regions; scores (geopolitical, geoeconomic, security, diplomatic, stability); aiAnalysis; and confidence (high, medium, low). The UI relies on these fields to display EventCard metadata and to compute risk, severity, and trend in the assessment panel.

To illustrate the mapping strategy, the following table specifies how article metadata maps into IntelEvent fields, including defaults, normalization steps, and notes on optionality.

Table 1: Field Mapping — Article metadata to IntelEvent

| Article Field | IntelEvent Field | Type | Required? | Normalization / Default | Notes |
| --- | --- | --- | --- | --- | --- |
| title | headline | string | Yes | Trim; limit length for UI line-clamp | Primary display text |
| body OR summary | description | string | Yes | Trim; sanitize HTML; keep first 1–2 paragraphs if long | Fall back to title if body absent |
| published_at OR parsed date | timestamp | Date | Yes | Parse to UTC; set timezone to Africa/Casablanca for normalization; ensure ISO8601 | If unknown, use ingestion time |
| source.name | source | string | Yes | Normalize to known source list; else keep | Used by EventCard and attribution |
| url | sourceUrl | string | Yes | Canonicalize; ensure http/https; record original | Used by “Read More” link |
| article language | n/a | string | No | If not Moroccan language and Morocco not in text, set confidence lower | Language detection may inform confidence |
| detected country (Morocco) | location.country | string | Yes | Set “Morocco” if present; else infer | UI displays country |
| detected region | location.region | string | No | Normalize to one of predefined regions; default “North Africa” | UI displays region; default to “North Africa” if absent |
| geocoded coords | location.lat, location.lng | number | No | Round to 6 decimals; validate bbox | If missing, UI still functions |
| NER actors list | actors | string[] | No | Deduplicate; cap 5–7 entries | Confidence increases with list length and source credibility |
| NER entities | regions | string[] | No | Normalize to region keys; unique | Drives UI region chips |
| classifier output | category | enum | Yes | Map to {political, military, economic, diplomatic} or extend | UI shows category in attribution |
| sentiment analysis | sentiment | enum | Yes | Map to {positive, negative, neutral} | UI chips rely on this |
| NLP classification | scores.geopolitical | number (0–100) | Yes | Initialize per scoring model; fallback 60–80 | UIassessment uses all five scores |
| NLP classification | scores.geoeconomic | number (0–100) | Yes | Initialize per scoring model; fallback 40–60 |  |
| NLP classification | scores.security | number (0–100) | Yes | Initialize per scoring model; fallback 50–70 |  |
| NLP classification | scores.diplomatic | number (0–100) | Yes | Initialize per scoring model; fallback 45–65 |  |
| NLP classification | scores.stability | number (0–100) | Yes | Initialize per scoring model; fallback 35–55 |  |
| Summarization | aiAnalysis | string | No | 1–3 sentences; plain text | Shown in assessment panel |
| confidence aggregator | confidence | enum | Yes | Calculate from source credibility, sentiment clarity, event characteristics; fallback medium | Drives UI confidence badge |

The UI components directly reference several of these fields, reinforcing compatibility requirements. The following table crosswalks fields to the components and their usage patterns.

Table 2: Component Crosswalk — IntelEvent fields used by LiveSignalsFeed and AIAssessmentPanel

| Field | LiveSignalsFeed Usage | AIAssessmentPanel Usage | Notes |
| --- | --- | --- | --- |
| id | EventCard key; selection state | Identifies event in summary and exports | Must be stable across updates |
| timestamp | formatTimestamp in EventCard header | Formatted display; exports | Must be Date-typed for formatting |
| headline | EventCard title; search | Displayed as main heading | Must be plain string |
| location.country | EventCard location display | Displayed in quick overview | Search filters on this field |
| location.region | Not directly displayed | Displayed in overview and summary | Used for impact context |
| sentiment | Sentiment chip in EventCard | Sentiment icon and badge; risk modifier | Filters expect this field |
| priority | Priority chip in EventCard | Risk modifier in calculation | Filters expect this field |
| source | EventCard attribution | Attribution footer; “Read More” label | |
| sourceUrl | Not displayed (EventCard) | “Read More” button href | Required for summary modal |
| category | Not displayed (EventCard) | Attribution footer | Derived category shown here |
| actors | Not displayed (EventCard) | “Key Actors” section | Chips with accent-primary styling |
| regions | Not displayed (EventCard) | “Affected Regions” section | Chips with sentiment-neutral styling |
| scores.* | Not displayed (EventCard) | Risk, severity, trend calculations and bars | five scores used in AIAssessmentPanel |
| aiAnalysis | Not displayed (EventCard) | Displayed in AI Agent Analysis section | |
| confidence | Not displayed (EventCard) | Badge and analytics dashboard | Used in risk computation as modifier |

### Provenance and Defaults

Provenance is captured via source and sourceUrl fields, ensuring transparent attribution and enabling users to read the original article via the “Read More” action in the assessment modal. Where coordinates are missing, location.lat/lng can be omitted or defaulted to null; the UI will still render the country and region. The category enumeration currently observed includes political, military, economic, and diplomatic; the design allows extension to broader categorizations while maintaining backward compatibility with existing logic.

Sentiment and confidence serve distinct roles: sentiment drives UI chips and filters and acts as a risk modifier in the AIAssessmentPanel’s risk calculation, whereas confidence influences the reliability of the risk computation. When the pipeline cannot confidently extract a field, it records lower confidence and avoids over-claiming precision.

## End-to-End Pipeline Architecture

The pipeline follows a sequential flow designed to maximize early structurization, minimize duplication, and integrate smoothly with UI refresh cycles.

1. Fetch: Retrieve Moroccan articles from trusted feeds and sources.
2. Parse: Normalize raw content, sanitize markup, and extract initial fields.
3. Normalize timestamps: Convert to UTC, apply timezone normalization to Africa/Casablanca when the article’s local time is known, and ensure ISO8601 formatting.
4. Extract and classify: Run NER for locations/actors; geocode to lat/lng; classify category, sentiment, and initial scores; generate aiAnalysis summaries.
5. Score: Compute priority and confidence using source credibility, content characteristics, and observed risk indicators.
6. Deduplicate: Canonicalize headlines and normalize source URLs; apply a similarity threshold; resolve ties using confidence and timestamp recency.
7. Persist: Store IntelEvents with stable identifiers and provenance metadata.
8. Publish: Emit deltas for LiveSignalsFeed; align with the three-second refresh cadence.
9. UI: Render events through EventCard and AIAssessmentPanel, with filters and search consistent with current behaviors.

To clarify component responsibilities, the following table maps pipeline stages to processors.

Table 3: Pipeline Stages vs Components

| Stage | Processor | Responsibilities | Outputs |
| --- | --- | --- | --- |
| Fetch | Ingestion Layer | Retrieve articles; record source and URL | Raw article records |
| Parse | Content Parser | Sanitize, extract title/body/date/source | Normalized article object |
| Normalize | Timestamp Normalizer | Parse and convert dates; apply timezone | UTC-normalized timestamp |
| Extract & Classify | NLP Service | NER; geocoding; classification; summarization | Structured fields and scores |
| Score | Scoring Engine | Compute priority and confidence; init scores | IntelEvent with scores and priority |
| Dedup | Deduplication Service | Canonicalize, compare, tie-break | Unique IntelEvents |
| Persist | Storage Layer | Upsert events; retain provenance | Durable IntelEvent records |
| Publish | Event Publisher | Delta updates; versioning | Stream compatible with UI |
| UI | LiveSignalsFeed + AIAssessmentPanel | Render cards; filters; analysis | End-user view and actions |

### Error Handling and Fallbacks

The pipeline must degrade gracefully. If geocoding fails, location.lat/lng may be omitted; the UI will still display country and region. If category classification is uncertain, default to neutral categories like economic or political, with lower confidence recorded in the event metadata. Missing timestamps are replaced with ingestion times, but the event is flagged with a low-confidence indicator to discourage premature priority escalation. Every failure case is logged with structured error metadata to support QA and iterative tuning.

## Content Analysis: Extraction Strategy

Extracting meaningful signals from Moroccan news requires a focused taxonomy that prioritizes reliability and UI compatibility while accommodating country-specific nuances. The pipeline leverages NER to identify locations, actors, and risk indicators, then applies rules calibrated to Moroccan contexts to attribute geopolitical and stability relevance.

Table 4: Extraction Taxonomy

| Entity Type | Examples (Morocco-focused) | Detector Methods | Confidence Heuristics |
| --- | --- | --- | --- |
| Locations | Morocco; cities (Casablanca, Rabat, Marrakech, Fez); regions (Souss-Massa, Oriental, etc.); neighboring countries (Algeria, Spain, Mauritania) | NER; gazetteers; geocoding | High if from article lead or explicit geocoding; moderate if inferred from context |
| Actors | Government ministries; Royal Armed Forces; security agencies; political parties; trade unions; media outlets; business associations | NER; actor dictionaries | High if official names and titles detected; moderate for generic references |
| Regions | North Africa; Maghreb; Western Sahara; MENA references | NER; region normalization table | High when explicitly stated; moderate when implied by proximity or policy scope |
| Risk Indicators | Protests, strikes, policy changes, security incidents, diplomatic meetings, trade/subsidy announcements | Rule-based patterns; keyword triggers | High for concrete incidents; moderate for policy speculation |
| Geopolitical Relevance | EU-Spain-Morocco relations; Western Sahara developments; migration; counterterrorism; fisheries and maritime issues; Algeria-Morocco tensions | Classification + contextual rules | High when external actors involved; moderate for domestic-only events with potential spillover |

### Location Extraction and Geocoding

City- and region-level detection is achieved through NER combined with Moroccan gazetteers and standardized region keys. Geocoding converts recognized place names into lat/lng coordinates with six-decimal precision. When geocoding fails or is ambiguous, the pipeline retains country- and region-level fields and records lower confidence. Location resolution maintains a record of toponym variants (e.g., Arabic/French names) to prevent mismatches and ensure consistent region chips in the UI.

### Actor and Organization Extraction

Actors include state bodies (e.g., ministries), security forces, political parties, unions, and influential business groups. Extraction relies on NER with curated actor dictionaries and role inference from sentence patterns. Multiple mentions are deduplicated, trimmed to a manageable number for UI display, and annotated with confidence based on the specificity and number of references.

### Risk Indicators and Geopolitical Relevance

Risk indicators are detected via rule-based patterns and keyword triggers aligned to security, diplomatic, and economic domains. Geopolitical relevance is elevated when external actors or cross-border implications are present—particularly for EU-Spain-Morocco dynamics, Western Sahara, migration flows, fisheries and maritime issues, and Algeria-Morocco relations. The system also detects domestic developments with potential spillover, marking them with moderate-to-high relevance based on the scope and stakeholder involvement.

## Categorization Framework

Categories must match the current UI while allowing future extensions. The observed categories include political, military, economic, and diplomatic. The framework below supports these and introduces higher-level groupings (Politics, Economy, Security, Society) without breaking existing logic.

Table 5: Category Mapping — Observed vs Proposed Groupings

| Observed Category | Proposed Grouping | Definition | Moroccan Examples |
| --- | --- | --- | --- |
| political | Politics | Domestic governance, parties, elections, policy statements | Election-related developments; policy announcements |
| military | Security | Armed forces, defense procurement, security operations | Military exercises; security incidents |
| economic | Economy | Trade, industry, finance, subsidies, inflation | Trade agreements; subsidy reforms; inflation reports |
| diplomatic | Politics/Diplomacy | Foreign relations, state visits, international agreements | EU-Morocco meetings; bilateral agreements |
| (extend) | Society | Labor, social movements, culture, public health | Protests/strikes; labor negotiations; social reforms |

Fallback logic ensures that uncertain classifications default to neutral categories and lower confidence, preserving UI consistency.

## Priority Scoring and Intelligence Value

Priority drives EventCard chips and acts as a key modifier in AIAssessmentPanel’s risk calculation. The scoring model is transparent and stable under frequent refresh cycles, balancing source credibility, content characteristics, and clarity of sentiment and risk indicators.

Key elements:
- Source credibility contributes a base score.
- Security-related indicators and negative sentiment elevate priority.
- Multi-region scope and explicit escalation cues (e.g., “tensions escalate”) increase the score.
- Confidence reflects reliability and dampens or reinforces priority depending on data quality.

Table 6: Priority Score Components and Weights

| Signal | Weight Range | Rationale |
| --- | --- | --- |
| Source credibility (high vs medium vs other) | +30 to +40 | Baseline reliability |
| Security indicators present | +25 to +35 | Heightened risk |
| Negative sentiment clarity | +15 to +25 | Escalation likelihood |
| Multi-region impact | +10 to +15 | Broader implications |
| Diplomatic friction | +10 to +20 | Potential instability |
| Geopolitical salience (external actors) | +10 to +20 | Wider strategic relevance |
| Confidence level | Multiplier: 0.9–1.0 | Reliability adjustment |

Final scores are mapped to priority tiers used by the UI.

Table 7: Priority Mapping — Score Thresholds to Priority Tiers

| Score Range | Priority Tier | UI Behavior |
| --- | --- | --- |
| 80–100 | high | Red chip; potential risk boost |
| 50–79 | normal | Default chip |
| 0–49 | low | Gray chip; de-emphasized |

### Score Initialization and Defaults

Scores initialize within bounded ranges observed in the codebase:
- geopolitical: 60–100
- geoeconomic: 40–100
- security: 50–100
- diplomatic: 45–100
- stability: 35–100

These ranges are refined over time with calibration and feedback loops, ensuring alignment with analyst expectations and the risk computation in AIAssessmentPanel.

## Timestamp Normalization and Deduplication Logic

Timestamp normalization ensures consistent rendering in both LiveSignalsFeed and AIAssessmentPanel. Deduplication prevents the UI from being flooded with near-identical records and preserves high-confidence, recent events.

Normalization:
- Parse article published_at when present; convert to UTC.
- Apply timezone normalization to Africa/Casablanca when local time is known; store as ISO8601.
- If the date is missing or unparseable, use ingestion time and record lower confidence.

Deduplication:
- Canonicalize headlines by lowercasing, stripping punctuation, and normalizing whitespace.
- Normalize source URLs by removing tracking parameters and resolving known redirects.
- Compare canonicalized headlines and normalized source URLs within sliding windows (e.g., 24 hours). Use a similarity threshold (e.g., Jaccard or cosine similarity on tokens) to identify near-duplicates.
- Tie-breakers prefer higher confidence; if confidence is equal, prefer the most recent timestamp; if still tied, prefer the more credible source.

Table 8: Deduplication Strategy Matrix

| Canonical Key | Similarity Threshold | Window | Tie-Breakers |
| --- | --- | --- | --- |
| Normalized headline + source domain | ≥ 0.85 | 24 hours | 1) Higher confidence; 2) More recent timestamp; 3) Higher source credibility |

Edge cases:
- Updated articles: If an article changes materially (e.g., new facts, different headline), treat as a new event; otherwise update the existing record and preserve its identifier.
- Reposts: Detect near-identical content across outlets using URL and content similarity; keep the highest-confidence source record.

## Integration with LiveSignalsFeed

LiveSignalsFeed expects an array of IntelEvent records, renders EventCard components, and applies filters for sentiment, priority, and search. It refreshes every three seconds, briefly showing an “UPDATING” indicator. The Moroccan pipeline emits deltas consistent with this cadence.

Filtering and search behaviors:
- Sentiment filter matches event.sentiment to one of positive, negative, neutral, or all.
- Priority filter matches event.priority to high, normal, low, or all.
- Search matches the query against event.headline and event.location.country.

Table 9: LiveSignalsFeed Interface Alignment

| Input | Display Field | Filter/Search Behavior | Notes |
| --- | --- | --- | --- |
| events: IntelEvent[] | EventCard list | Filters: sentiment, priority; Search on headline and country | Auto-refresh every 3 seconds |
| selectedEventId | Event selection state | Highlights selected card | Triggers AIAssessmentPanel |
| formatTimestamp(date) | Timestamp display | dd MMM yyyy HH:mm | Ensures consistency |
| sentiment | Sentiment chip | Color-coded | Chips use specific styles |
| priority | Priority chip | Color-coded | Drives triage attention |
| location.country | Location text | Included in search | Country shown on card |
| source | Attribution | n/a | Footer of card |

### Compatibility Considerations

The architecture assumes a known field set based on component usage, since the formal IntelEvent type definition is not available. A compatibility shim ensures field presence, type correctness, and default values, preventing UI exceptions. All Date fields are properly typed to support the formatTimestamp utility. Event identifiers are stable, and new events do not disrupt selection state or filter logic.

## Integration with AIAssessmentPanel

AIAssessmentPanel consumes the full IntelEvent to compute an overall risk score, severity level, and trend direction; it also renders scores, actors, regions, and confidence, and supports Markdown summary exports.

Risk computation:
- Weighted combination of security, geopolitical, diplomatic, and stability scores.
- Stability is inverted to represent risk (higher stability reduces risk).
- Priority and sentiment act as multipliers; confidence moderates risk.
- Multi-region events receive a slight risk boost.

Table 10: AIAssessmentPanel Risk Model Mapping

| Input | Role | Calculation Step | Output Use |
| --- | --- | --- | --- |
| scores.security | Risk factor | Weighted sum | Overall risk numerator |
| scores.geopolitical | Risk factor | Weighted sum | Overall risk numerator |
| scores.diplomatic | Risk factor | Weighted sum | Overall risk numerator |
| scores.stability | Inverse factor | 100 − stability; weighted | Overall risk numerator |
| scores.geoeconomic | Secondary factor | Weighted | Overall risk numerator |
| priority | Modifier | Multiplier (high > normal > low) | Escalates risk |
| sentiment | Modifier | Negative increases risk | Escalates/de-escalates |
| confidence | Modifier | Dampens risk when low | Reliability adjustment |
| regions.length | Modifier | >1 boosts risk | Cross-regional impact |

Summaries and exports:
- The assessment panel assembles an executive summary with headline, location, priority, sentiment, confidence, scores, severity, trend, actors, regions, source, and category.
- The summary is exportable as Markdown, including a “Read More” link to sourceUrl.

### Score Visualization Contract

Five scores must be initialized for every event: geopolitical, geoeconomic, security, diplomatic, stability. The UI uses these to render bars and compute severity and trend. When data is sparse, bounded default ranges ensure consistent visualization without misleading precision.

## Implementation Plan and Milestones

The implementation proceeds in phases to deliver value early while maintaining compatibility and quality.

Phase 1 — Field Mapping and Parsing:
- Implement article-to-IntelEvent field mapping, including defaults and normalization.
- Build timestamp normalization and basic source attribution.

Phase 2 — Extraction and Classification:
- Integrate NER and geocoding for locations and actors; implement region normalization.
- Build category and sentiment classifiers; generate aiAnalysis summaries.

Phase 3 — Scoring:
- Implement priority scoring and confidence aggregation; initialize five scores within bounded ranges.
- Validate UI priority chips and assessment modifiers.

Phase 4 — Dedup:
- Build canonical headline normalization and URL cleaning; implement similarity-based deduplication with tie-breakers.
- Handle updated articles and reposts.

Phase 5 — Integration and QA:
- Publish events to LiveSignalsFeed; validate filters and search.
- Integrate with AIAssessmentPanel; verify risk computation, severity, trend, and export workflows.

Phase 6 — Pilot and Tuning:
- Run pilot with Moroccan sources; calibrate extraction thresholds, scoring weights, and dedup parameters.
- Establish feedback loops with analyst feedback; iterate.

Table 11: Milestone Plan

| Phase | Deliverables | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- |
| 1 | Field mapping; parsing; normalization | Access to ingestion data | All required fields populated with correct types |
| 2 | Extraction (NER, geocoding); classification; summarization | Phase 1 | Locations/actors extracted with confidence; category and sentiment assigned |
| 3 | Priority and confidence scoring; score initialization | Phase 2 | Priority tiers align with UI; scores render correctly |
| 4 | Deduplication with tie-breakers | Phase 3 | Duplicate rates below threshold; stable IDs |
| 5 | UI integration and QA | Phases 1–4 | Filters and search work; assessment panel computes and exports |
| 6 | Pilot calibration and tuning | Phase 5 | Stable feed under 3-second refresh; analyst acceptance |

## Quality Assurance and Validation

Quality assurance ensures that the converted events are accurate, deduplicated, and UI-ready. Automated tests verify field mapping, timestamp parsing, category and sentiment classification, priority thresholds, and dedup logic. Manual reviews sample outputs for extraction fidelity and geopolitical relevance. Canary monitoring validates UI stability under the three-second refresh cadence.

Table 12: Validation Matrix

| Feature | Test Method | Expected Outcome | Error Handling |
| --- | --- | --- | --- |
| Field mapping | Unit tests | All fields present with correct types | Defaults applied; errors logged |
| Timestamp normalization | Unit + integration tests | ISO8601 UTC; correct display format | Fallback to ingestion time; flag low confidence |
| Category/sentiment | Classifier tests | Matches enumerated values; stable under refresh | Fallback to neutral; record confidence |
| Priority scoring | Threshold tests | Correct tier assignment per score ranges | Multipliers applied; no frequent flips |
| Deduplication | Similarity tests | Near-duplicates merged; IDs stable | Tie-breakers applied; retain best record |
| UI filters/search | UI integration tests | Sentiment/priority filters; search works | Graceful empty states |
| Assessment panel | Risk computation tests | Correct overall risk, severity, trend | Modifiers applied; bounds enforced |

## Security, Compliance, and Ethical Considerations

Content is attributed to original sources with sourceUrl provided. Sanitization prevents HTML injection and ensures safe rendering. Privacy is respected by avoiding personal data collection beyond what is necessary for geopolitical analysis. The system uses rate limiting and backpressure to protect UI responsiveness and downstream services. All operations are logged for auditability, with structured metadata supporting debugging and continuous improvement.

## Extensibility and Future Enhancements

The architecture is designed to scale across additional countries and languages. It supports pluggable NER and classification models and configurable scoring weights and thresholds. Beyond the LiveSignalsFeed and AIAssessmentPanel, the IntelEvent structure can power map views, region dashboards, and alerts—using the same fields and semantics to deliver consistent analyst experiences.

## Appendix: UI Contract References

The following references summarize observed behaviors and display rules to guide implementation and testing. They are derived from component usage patterns in the current codebase.

- LiveSignalsFeed:
  - Props: onEventSelect(event), optional selectedEventId.
  - State: events: IntelEvent[]; lastUpdate: Date; isUpdating boolean; filters for sentiment, priority, and search.
  - EventCard rendering: key=event.id; displays timestamp via formatTimestamp; headline; sentiment chip; priority chip; location.country; source attribution.
  - Filters: sentiment (all, positive, negative, neutral); priority (all, high, normal, low); search matches headline and country.
  - Auto-refresh: every three seconds; brief “UPDATING” indicator.

- AIAssessmentPanel:
  - Props: event: IntelEvent | null; onClose().
  - Risk model: weighted combination of five scores; stability inverted; priority and sentiment multipliers; confidence modifier; multi-region boost.
  - Displays: sentiment icon and badge; priority badge; location.country and region; “Key Actors”; “Affected Regions”; AI analysis text; confidence badge; scores bars; severity; trend; source and category attribution.
  - Summary modal: executive summary, risk snapshot, analytics dashboard, article text, “Read More” link to sourceUrl; Markdown export.

To consolidate the contract expectations, the following table summarizes required fields and enumerations.

Table 13: UI Contract Summary

| Component | Expected Fields | Enumerations | Display Rules |
| --- | --- | --- | --- |
| LiveSignalsFeed | id, timestamp, headline, sentiment, priority, location.country, source | sentiment: positive, negative, neutral; priority: high, normal, low | Chips color-coded; search filters headline and country |
| AIAssessmentPanel | scores.{geopolitical, geoeconomic, security, diplomatic, stability}, actors, regions, aiAnalysis, confidence, sourceUrl, category | confidence: high, medium, low; category: political, military, economic, diplomatic | Risk bars; badges; exportable summary; “Read More” link |

---

By aligning the architecture tightly with these observed UI behaviors and data structures, the Moroccan news-to-IntelEvent integration will be both immediately usable and strategically extensible. It ensures reliable extraction and categorization, accurate and stable priority scoring, effective deduplication, and safe, performant UI integration—supporting WarTracker24’s intelligence mission with minimal friction and maximum clarity.
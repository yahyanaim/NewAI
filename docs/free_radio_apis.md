# Free Radio APIs and Streaming Services with a Focus on Moroccan and Arabic Content: Integration Methods and Verification Plan

## Executive Summary

This report maps the free and accessible radio APIs relevant to Moroccan and Arabic content discovery and playback, and sets out a practical integration plan. The scope covers six public-facing API/service categories: RadioBrowser.info, TuneIn (unofficial streaming API plus official broadcaster metadata push), SHOUTcast (directory and DNAS-compatible endpoints), AzuraCast (self-hosted API), iHeartRadio (unofficial client library), and reputable third‑party directories useful as verification aids.

Four headline findings emerge:

- RadioBrowser.info is the most immediately productive source for free, open station discovery for Morocco and Arabic-language stations. It exposes rich search and listing endpoints, multiple output formats (JSON, M3U, PLS, XSPF, CSV, XML), and station health metadata, and it encourages client libraries and multi-server redundancy. Its structure and filters are well suited to building robust discovery flows and playlist generation.[^1][^2][^3]

- TuneIn provides two distinct integration surfaces. For metadata publishing, the official AIR (Advanced Information Radio) API allows broadcasters to push now‑playing data to TuneIn, using a GET endpoint with partner credentials and a strict submission cadence. For programmatic consumer discovery, an unofficial TuneIn streaming API exists, documented by a third party; it can be useful for prototyping but carries stability and terms-of-service risks and should be handled with caution.[^6][^8][^9]

- SHOUTcast offers a directory for developers and, importantly, a widely implemented set of DNAS-compatible public endpoints under sc_mirror that many servers and compatibility layers expose (e.g., stats and current song via “7.html” for v1 and via admin.cgi for v2 with viewjson/viewxml). However, the official directory’s endpoints and authentication are not fully documented on public pages and typically require registration; developers often rely on the sc_mirror documentation and community knowledge to build integrations.[^12][^13][^15]

- For operational control, AzuraCast exposes a comprehensive REST API (OpenAPI 3.0) with public endpoints for now‑playing and schedule information, and authenticated endpoints for full station and content management. It is well suited to teams needing to run and automate their own stations with full API coverage and an open-source, self-hosted model.[^18][^19]

Based on these findings, the recommended short-term implementation path is to use RadioBrowser.info for station discovery (especially for Moroccan stations and Arabic-language filters), TuneIn AIR for broadcaster metadata distribution, and AzuraCast for internal operations and program control. The SHOUTcast-compatible endpoints can be used to enrich metadata extraction for Icecast/SHOUTcast sources, with careful handling of CORS and mixed-content constraints. iHeartRadio’s unofficial client library can be experimented with for stream resolution, but production reliance is not advised without an official partnership.

Immediate outputs for engineering include: a consolidated endpoint catalog and parameter matrix; example requests for discovery (e.g., by countrycode=MA and bylanguage=arabic); method summaries for broadcaster metadata push; and a CORS/HTTPS/mixed‑content playbook for reliable playback. A verification plan is included to confirm formats and URLs via live tests and to document status, reliability, and legal considerations.

Information gaps remain where public documentation is incomplete, notably: the official Radio.net developer API (undocumented), SHOUTcast directory endpoints and auth (not fully public), TuneIn’s consumer streaming endpoints (only unofficial docs), iHeartRadio’s official API for third-party developers (unclear), and some direct stream URLs for Moroccan stations (often embedded or platform‑specific). The plan addresses these gaps via cross‑directory verification, conservative assumptions, and ongoing validation.[^11][^12][^8][^25][^23]

In short, teams can move quickly and safely with RadioBrowser.info plus AzuraCast and TuneIn AIR, layer SHOUTcast-compatible reads where relevant, and maintain a separate experimental track for iHeartRadio and TuneIn unofficial usage pending further validation.

---

## Scope, Methodology, and Evaluation Criteria

The scope is limited to free or open-access APIs and services that help developers discover, verify, and integrate radio stations with a focus on Morocco and the Arabic-speaking world. We categorize these into (a) aggregators/directories with public APIs, (b) self-hosted platforms with APIs, (c) broadcaster metadata distribution endpoints, and (d) third-party directories used for verification.

Evaluation criteria emphasize:

- Free access and low barriers to entry (no upfront cost, minimal or no authentication where feasible).
- Documentation quality and stability of endpoints.
- Coverage of Morocco and Arabic-language stations, including filters and reliable metadata.
- Playback feasibility across browsers and native clients with attention to HTTPS, CORS, and HLS/MP3/AAC considerations.

Methodologically, we rely on official documentation where available;unofficial sources are labeled and treated cautiously. Practical tests are planned to confirm endpoint behavior and URL formats, with results to be recorded in a verification log. This approach aligns with the open nature of RadioBrowser.info and the breadth of its reference documentation.[^2][^3]

---

## API and Service Landscape

RadioBrowser.info and AzuraCast expose fully documented public endpoints suitable for production use. TuneIn provides an official broadcaster metadata push interface and a separate unofficial streaming API. SHOUTcast’s directory requires further exploration, but DNAS-compatible public endpoints are widely used via the sc_mirror documentation. Third‑party directories (Radio.net, Streema, OnlineRadioBox, myTuner) aid discovery and verification but are not primary sources for direct stream URLs in most cases. ICEcast, the open streaming server technology, underpins many station streams and is relevant for configuration and compatibility considerations.

To situate these options, Table 1 compares key attributes.

To illustrate the landscape succinctly, the following table compares base access, authentication, endpoints, and Moroccan/Arabic relevance.

Table 1. Comparison of key APIs and services

| Provider | Base access | Auth required | Representative endpoints | Output formats | Moroccan/Arabic relevance |
|---|---|---|---|---|---|
| RadioBrowser.info | Free, open | None for public discovery | /json/stations/search; /json/stations/bycountrycodeexact/MA; /json/stations/bylanguageexact/arabic; /json/url/{uuid} | JSON, XML, CSV, M3U, PLS, XSPF, TTL | High. Strong countrycode and language filters; station health fields. |
| TuneIn (AIR – official broadcaster metadata) | Free, credentials required | Partner ID/key; station ID | air.radiotime.com Playing.ashx (GET with partnerId, partnerKey, id, title, artist, album, commercial) | Acknowledgement via HTTP status | High for metadata distribution to TuneIn listeners; not a raw stream directory. |
| TuneIn Streaming API (unofficial) | Public | None documented; subject to change | opml.radiotime.com (various consumer endpoints) | OPML/varies | Useful for prototyping; coverage and stability uncertain; ToS risk. |
| SHOUTcast (directory) | Public portal; dev info general | Developer program not fully public | Directory developer landing; endpoint details via sc_mirror/admin pages | JSON/XML (via compatibility), legacy HTML | Useful as directory; specifics require registration/community docs. |
| SHOUTcast-compatible API (sc_mirror) | Public | None for reads | stats and current song endpoints (legacy “7.html”, admin.cgi with viewjson/viewxml) | JSON, XML, HTML | Practical for reading metadata/stats from SHOUTcast/Icecast servers. |
| AzuraCast (self-hosted) | Open source; local install | API keys for admin actions | Public: now playing, station info, schedule; Auth: station config, media, mount points, HLS, queue, etc. | JSON | High for operators; enables full control of stations with API coverage. |
| iHeartRadio (unofficial client) | Public | None documented | search(), streamURL() methods | Client-resolved stream URLs | Experimental; stream resolution example exists; production use not recommended. |
| Radio.net, Streema, OnlineRadioBox, myTuner | Public directories | N/A for discovery pages | Station listings by country/language | Web players; no official public API | Useful for cross-checking coverage and station identity; not primary API sources. |

Sources: RadioBrowser API reference and server documentation; TuneIn AIR and unofficial API; SHOUTcast developer pages and sc_mirror documentation; AzuraCast API docs; iHeartRadio unofficial library; directory listings for Arabic stations.[^1][^2][^6][^8][^12][^13][^15][^18][^25][^21][^22][^23]

### RadioBrowser.info API (Free, Open)

RadioBrowser.info is a community-driven catalog of internet radio and TV stations with a free, open API designed for high accessibility and resilience. It provides a station data model that includes identifiers, stream URLs, optional resolved URLs (url_resolved), country and language fields (including ISO 3166-1 alpha‑2 country codes and language codes), and a rich set of health and metadata fields (e.g., lastcheckok, hls, codec, bitrate, click counts). The API supports multiple formats and flexible filtering, and it offers endpoints for server statistics and monitoring. Libraries exist for major languages, and clients are encouraged to implement server list discovery for load distribution.[^1][^2][^3][^4]

To guide engineering usage, Table 2 summarizes key endpoints and representative filters.

Table 2. RadioBrowser endpoint matrix (selected)

| Endpoint path | Purpose | Key parameters | Output formats |
|---|---|---|---|
| /{format}/stations/search | Advanced search with flexible filters | name, country, countrycode, state, language, tag, tagList, codec, bitrateMin/Max, has_geo_info, has_extended_info, is_https, order, reverse, offset, limit, hidebroken | JSON, XML, CSV, M3U, PLS, XSPF, TTL |
| /{format}/stations/bycountrycodeexact/{code} | Exact country-code filter (e.g., MA) | order, reverse, offset, limit, hidebroken | JSON, XML, CSV, M3U, PLS, XSPF, TTL |
| /{format}/stations/bylanguageexact/{language} | Exact language filter (e.g., “arabic”) | order, reverse, offset, limit, hidebroken | JSON, XML, CSV, M3U, PLS, XSPF, TTL |
| /{format}/stations/byname/{name} | Name prefix/contains search | order, reverse, offset, limit, hidebroken | JSON, XML, CSV, M3U, PLS, XSPF, TTL |
| /{format}/url/{stationuuid} | Click counter + direct stream redirect | stationuuid | JSON, XML, M3U, PLS |
| /{format}/stats | Service statistics | N/A | JSON, XML |
| /{format}/countries, /countrycodes | Country lists and codes | order, reverse, hidebroken, offset, limit | JSON, XML, CSV |

Notes: The {format} placeholder typically is json, xml, csv, m3u, pls, xspf, or ttl. The “hidebroken” parameter can improve user experience by excluding stations currently failing checks. The click counter endpoint should be invoked when initiating playback for analytics and popularity metrics.[^2]

Implementation considerations:
- Use url_resolved when downstream clients cannot resolve playlists/redirects automatically.
- Prioritize HTTPS streams when is_https=true to avoid mixed-content errors in secure contexts.
- Use hidebroken=true and lastcheckok for quality screening in UIs.
- Maintain server list awareness per RadioBrowser guidance to balance load across mirrors.[^1][^2][^3][^4]

### TuneIn APIs: AIR (Broadcaster Metadata) and Unofficial Streaming API

TuneIn’s AIR (Advanced Information Radio) API is the official way for broadcasters to push now‑playing metadata to TuneIn. It uses a simple GET endpoint with required credentials and station identifiers and enforces a submission cadence of one update at the start of each song. This ensures listener discoverability by track/artist and playlist history on TuneIn’s properties without flooding their systems.[^6]

Table 3. TuneIn AIR parameters and behavior

| Parameter | Required | Description |
|---|---|---|
| partnerId | Yes | Unique partner ID assigned by TuneIn |
| partnerKey | Yes | Unique partner key assigned by TuneIn |
| id | Yes | TuneIn station ID (format s######) |
| title | Yes | Name of the currently playing song |
| artist | Yes | Name of the currently playing artist |
| album | No | Name of the associated album |
| commercial | No | Set to “true” if the current segment is a commercial or non-song content |

Behavior: Submit once at song start; do not poll or submit repeatedly. HTTP 200 indicates acceptance. Updates may take up to a day to appear on TuneIn.com and mobile apps.[^6]

For consumer-side discovery, an unofficial TuneIn streaming API is documented by a third party, with a base OPML endpoint and various consumer endpoints. While this can be useful for prototyping, the documentation is community-maintained and may drift from actual behavior; teams should treat it as experimental and assess compliance with TuneIn’s terms accordingly.[^8][^9]

Table 4. Unofficial TuneIn API overview

| Aspect | Summary |
|---|---|
| Base | OPML endpoint for TuneIn stream discovery (documented as used by TuneIn web properties) |
| Nature | Unofficial, community-maintained docs |
| Stability | Variable; may change without notice |
| Recommendation | Use for experimentation; avoid for production unless formal arrangement exists |

### SHOUTcast (Directory and DNAS-Compatible API)

The SHOUTcast developer page signals an ecosystem for integrating stations into apps and sites, but does not publicly detail full endpoint specifications or authentication. In practice, developers often rely on the sc_mirror documentation for DNAS public pages and the SHOUTcast‑compatible API that implements legacy v1 endpoints (e.g., “7.html” for current song and listeners) and v2.5 admin endpoints that return XML or JSON, with a “sid” parameter to select a specific stream where multiple exist on a server.[^12][^13][^15]

Table 5. SHOUTcast-compatible endpoint examples (sc_mirror)

| Function | Endpoint (path and query) | Output |
|---|---|---|
| Legacy current song (v1) | …/7.html | HTML page with current song/listeners |
| Statistics (v2 admin) | …/admin.cgi?mode=viewjson&sid=… | JSON |
| Statistics (v2 admin) | …/admin.cgi?mode=viewxml&sid=… | XML |

Notes: The DNAS public pages reference includes other legacy endpoints and behaviors; compatibility layers in the ecosystem expose similar interfaces. Authentication may be required for admin operations; public stats pages are often accessible without auth. Developers must test endpoints per server and handle CORS and HTTPS constraints carefully.[^13][^15]

### iHeartRadio (Unofficial Client Library)

An unofficial JavaScript library demonstrates how to search iHeartRadio stations and resolve stream URLs. The library includes methods to search by query and to derive stream URLs from station objects. No official authentication is described, and the implementation may be sensitive to site changes. As such, it is a useful reference and experimental tool rather than a recommended foundation for production integrations without a formal partnership.[^25]

Table 6. iHeartRadio unofficial methods and options

| Method | Inputs | Outputs | Notes |
|---|---|---|---|
| search(query, options) | query string; optional proxy | Object with stations array | Use a CORS proxy in browser contexts |
| streamURL(station, options) | station object; optional proxy | Stream URL string | Example outputs include AAC/HLS URLs per library docs |

### Radio.net (Directory; API Unknown)

Radio.net provides comprehensive station listings, including dedicated Arabic-language pages that aggregate many relevant streams. While invaluable for discovery and verification, the available materials do not document a public developer API. As a result, Radio.net is best treated as a discovery and cross‑verification resource rather than as a programmatic source of stream URLs.[^11][^21]

### AzuraCast (Self-Hosted API)

AzuraCast is a free, open-source, self-hosted radio management suite. Its OpenAPI‑based REST API separates public endpoints (e.g., now playing, station information, schedules, on-demand content, podcasts) from authenticated endpoints that cover station configuration, media management, mount points, HLS streams, playlists, remote relays, reports, and administrative operations (e.g., API key management, backups, system services, and logs). For operators who need full control over stations and workflows, AzuraCast’s breadth and open model are compelling.[^18][^19]

Table 7. AzuraCast endpoint categories (selected)

| Category | Public endpoints | Authenticated endpoints |
|---|---|---|
| Now playing & station info | Retrieve current track, station profile, schedule | Manual now playing updates; station profile edits |
| Media & playlists | List on-demand tracks; podcast episodes | Upload/manage media; create/update/delete playlists; import/export |
| Mount points & HLS | Public mount details (read) | Create/update/delete mount points and HLS streams; intro tracks |
| Queue & requests | Retrieve upcoming queue | Enqueue/dequeue; song request submission |
| Reports & analytics | Listener stats and history | Detailed reports (by client/country/time), charts |
| Administration | N/A | System service control; backup/restore; user/role management; API key management; global settings |

### Third-Party Directories for Verification

Reputable directories such as Streema, OnlineRadioBox, and myTuner provide station listings, descriptions, and web players for Moroccan and Arabic stations. These are valuable for cross‑checking identity, coverage, and genre information. However, they typically expose stream URLs through embedded players rather than documented public APIs, so developers should avoid scraping and instead use them to validate results from primary APIs.[^22][^23][^24]

---

## Focused Station Discovery: Moroccan and Arabic Content

RadioBrowser.info’s filters make it straightforward to target Moroccan stations and Arabic-language programming. Two filters are especially useful: exact country code (MA) and exact language (“arabic”). Combined with parameters such as hidebroken, is_https, and order by votes or clickcount, these filters produce high‑quality candidate lists suitable for playlist generation and UI surfacing.[^2]

Table 8. Example queries for Moroccan and Arabic stations

| Use case | Endpoint | Key parameters |
|---|---|---|
| All Morocco stations | /json/stations/bycountrycodeexact/MA | hidebroken=true; order=clickcount; reverse=true |
| Arabic-language stations | /json/stations/bylanguageexact/arabic | hidebroken=true; order=votes; reverse=true |
| Morocco + HTTPS preference | /json/stations/search | countrycode=MA; is_https=true; hidebroken=true |
| Morocco + recent activity | /json/stations/search | countrycode=MA; order=lastchangetime; reverse=true; hidebroken=true |

Cross-verification via directories:
- For Moroccan stations, verify identity and genre with Streema’s Morocco catalog and, where available, with OnlineRadioBox and myTuner entries.[^22][^23][^24]
- For Arabic-language stations and broader MENA coverage, use Radio.net’s Arabic-language page to corroborate station names and presence.[^21]

Table 9. Verification checklist for candidate stations

| Step | What to check | Sources |
|---|---|---|
| 1 | Confirm station name and country | RadioBrowser results vs. directory listings |
| 2 | Validate that stream is reachable and HTTPS | Click counter endpoint for redirect; test playback in a secure context |
| 3 | Confirm language/genre | Compare tags and language fields with directory descriptions |
| 4 | Assess stream health | lastcheckok, codec/bitrate, and HLS flag |
| 5 | Record resolved URL | Capture url_resolved if downstream cannot resolve playlists |

### Moroccan Stations: Examples and Validation

Prominent Moroccan stations—such as Radio 2M and Medi 1—are listed on multiple directories with TuneIn presence. This enables identity validation and metadata cross‑checks even when direct stream URLs are embedded or vary over time. The official sites for Radio 2M and Medi 1 can be used to confirm brand context, language splits, and to monitor changes.[^28][^31][^29][^32][^27][^30]

Table 10. Moroccan stations (examples) and verification references

| Station | Frequency / City | Official site | TuneIn link | Directory references |
|---|---|---|---|---|
| Radio 2M | 93.1–93.5 FM; Casablanca/Rabat | Radio 2M official site | TuneIn: Radio 2M | Streema; OnlineRadioBox; myTuner |
| Medi 1 | 95.3 FM; Tangier | Medi 1 official site | TuneIn: Medi 1 | OnlineRadioBox; Streema |

Playback considerations:
- Prefer HTTPS endpoints wherever available to avoid mixed-content errors in secure browsing contexts.
- Use url_resolved to handle redirects or playlist-based streams.
- Consider HLS streams for adaptive playback in modern clients; ensure AAC codec support where required.

### Arabic Language Stations: Regional Coverage

Arabic-language stations span North Africa and the Levant, with significant diaspora presence in Europe and North America. Radio.net’s Arabic catalog provides a wide survey and can be used to cross-check candidate stations discovered via RadioBrowser filters.[^21]

Table 11. Arabic stations by country/city (sample)

| Station | City/Country | Notes |
|---|---|---|
| Radio El Bahdja 91.5 FM | Algiers, Algeria | Charts/Pop |
| JIL FM | Algiers, Algeria | R’n’B/Pop |
| Radio Mosaïque FM | Tunis, Tunisia | Pop |
| Monte Carlo Doualiya | Paris, France | Talk/News |
| Byblos Radio | Beirut, Lebanon | 90s/Pop |
| Nogoum FM | Cairo, Egypt | Pop |
| Voice of Lebanon | Beirut, Lebanon | Generalist |
| Mix FM (Saudi) | Riyadh, Saudi Arabia | Hits/Pop |
| Al Khaleejiya | Dubai, UAE | Arabic Music |
| Radio Orient | Clichy, France | Arabic/Islamic Music |
| HIT RADIO | Rabat, Morocco | Hits |
| Medi 1 – Maghreb | Tangier, Morocco | Pop/Chanson |

Note: These examples illustrate coverage breadth; use RadioBrowser to programmatically assemble playlists and then verify station identity via the directories above.[^21]

---

## Streaming Formats, Formats, and Playback Constraints

Reliable playback hinges on understanding codecs, container formats, and transport protocols. Common audio codecs include MP3 and AAC, often transported via direct MP3/AAC streams or HTTP Live Streaming (HLS), which is identified in RadioBrowser via the hls flag. ICEcast servers can serve Ogg Vorbis, Opus, WebM, and MP3, and are widely deployed across the internet radio ecosystem. SHOUTcast-compatible servers expose metadata and statistics through legacy endpoints and admin pages that return XML or JSON.[^2][^15][^17]

Browser and native playback constraints:
- Mixed content: If your page is served over HTTPS, the stream URL must also be HTTPS to avoid browser blocks.
- CORS: Cross-origin restrictions may prevent direct audio fetch from browsers; proxying or server-side relay may be required.
- Codec support: Modern browsers widely support MP3 and AAC; Ogg/Opus support varies by browser. HLS support on non-Safari browsers may require Media Source Extensions (MSE) or a player library.

Table 12. Streaming formats quick reference

| Aspect | Options and implications |
|---|---|
| Codecs | MP3 (broad support), AAC (broad support in MP4/M4A), Ogg Vorbis/Opus (variable browser support) |
| Transport | Direct MP3/AAC streams; HLS (m3u8) for adaptive streaming |
| ICEcast server | Supports Ogg, Opus, WebM, and MP3 streams |
| Metadata endpoints | SHOUTcast-compatible: “7.html” (legacy), admin.cgi with viewjson/viewxml |
| HTTPS/CORS | Use HTTPS stream URLs in secure contexts; plan CORS proxies or server-side relay if needed |

---

## Integration Playbooks

RadioBrowser discovery and playback:
1. Query discovery endpoints with filters for Morocco (countrycode=MA) and Arabic language (language=arabic), adding hidebroken=true and sorting by votes/clickcount to surface stable stations.
2. For each candidate station, call the click counter endpoint with the station’s UUID to obtain a direct stream redirect (and to record a play).
3. Prefer url_resolved when downstream clients cannot resolve playlists or when you need a guaranteed final URL. If is_https=true, prefer HTTPS variants to avoid mixed-content warnings.
4. Generate playlists in M3U or PLS for media players that expect those formats.
5. Persist stationuuid for analytics and deduplication; cache resolved URLs with short TTLs to reduce redirects per play while keeping freshness.[^2]

AzuraCast operations:
1. Use public endpoints to expose now‑playing information, schedules, and on-demand content on your portal.
2. Use authenticated endpoints to automate station configuration (mount points, HLS streams), media uploads, playlist curation, and queue management.
3. Integrate reports and listener analytics into dashboards; leverage administrative endpoints for backups and service control.[^18][^19]

TuneIn broadcaster metadata push (AIR):
1. Obtain partnerId and partnerKey from TuneIn, and identify your station’s TuneIn ID (s######).
2. At each new song, submit title and artist via the AIR GET endpoint; include album when relevant. For non-music segments (e.g., ads), set commercial=true.
3. Avoid rapid or repeated submissions; one push per track start is sufficient.
4. Log HTTP responses and implement backoff logic in case of transient failures.[^6]

SHOUTcast-compatible reads:
1. For SHOUTcast/Icecast servers, read current song and listener stats using legacy v1 endpoints (7.html) or v2 admin endpoints with viewjson/viewxml and sid.
2. Normalize JSON/XML responses and map fields into your internal metadata model.
3. Respect server CORS policies; if calls are blocked by the browser, perform requests server-side or via a proxy.[^15]

iHeartRadio (experimental):
1. Use the unofficial client to search for stations and resolve stream URLs for experimentation in non-production contexts.
2. Employ a CORS proxy where necessary in browser code; evaluate proxy reliability and privacy implications.
3. Monitor for changes; avoid hardwiring assumptions into production-critical code paths.[^25]

Table 13. Playbook steps summary

| Service | Inputs | Actions | Outputs | Notes |
|---|---|---|---|---|
| RadioBrowser | Filters (countrycode, language), stationuuid | Search; click; resolve | Station list; direct stream URL | Use url_resolved for clients that don’t resolve playlists |
| AzuraCast | API key; station ID | Manage media, mounts, HLS; fetch now playing | Operational control; public data | Public endpoints for read; admin for write |
| TuneIn AIR | partnerId/key; station ID; track metadata | Push now playing on track start | HTTP acknowledgement | One submission per song; backoff on errors |
| SHOUTcast-compatible | Server base; sid | Read stats/current song | JSON/XML/HTML | Implement server-side calls if CORS blocks |
| iHeartRadio (unofficial) | Query string | Search; resolve stream URL | Stream URL | Experimental; consider proxy and ToS |

---

## Testing and Verification Plan

Endpoint validation:
- For RadioBrowser, run test queries to confirm filters (e.g., bycountrycodeexact=MA and bylanguageexact=arabic), verify JSON schemas, and confirm that click counters return redirectable URLs. Validate that hidebroken=true improves result quality.
- For SHOUTcast-compatible endpoints, test both legacy and admin paths to confirm current song and stats parsing across sample servers.
- For TuneIn AIR, simulate submissions and record HTTP responses; confirm update cadence enforcement by testing multiple submissions in short succession (expect throttling/blocking).
- For iHeartRadio unofficial, test search and stream URL resolution; record required CORS proxy behavior.

Playback tests:
- Validate HTTPS behavior: load streams in a secure context and verify that HTTPS URLs are used to avoid mixed-content errors.
- Test HLS and direct MP3/AAC playback across target browsers and devices.
- Capture metadata presence and accuracy, especially on SHOUTcast-compatible servers where metadata can be read from public pages.

Cross-verification:
- Use Radio.net’s Arabic-language listings and Streema’s Morocco catalog to confirm station identity and continuity across sources.
- Record the status of each tested endpoint and note any changes in behavior or error rates over time.

Table 14. Verification log template

| Timestamp | Endpoint | Parameters | Response summary | Status | Notes |
|---|---|---|---|---|---|
| YYYY-MM-DD HH:MM | /json/stations/bycountrycodeexact/MA | hidebroken=true | 200: N stations | OK | X HTTPS, Y HLS |
| YYYY-MM-DD HH:MM | /admin.cgi?mode=viewjson&sid=… | sid=1 | 200: JSON stats | OK | Metadata accurate |

---

## Legal, Compliance, and Reliability Considerations

- Terms of service: Unofficial endpoints (e.g., TuneIn streaming API documented by a third party, and iHeartRadio’s unofficial client) may change or conflict with provider terms. Use with caution, avoid production dependencies without formal arrangements, and monitor for changes.[^8][^25]
- Metadata push cadence: TuneIn AIR enforces submission rules. Over‑submission can be blocked; implement backoff and compliance logging.[^6]
- Mixed content: Ensure HTTPS stream URLs in secure contexts to prevent playback failures and browser security prompts.
- Data freshness: Rely on lastcheckok, lastchecktime, and hidebroken to improve user experience and avoid broken streams in playlists.[^2]
- Rate limits and server selection: RadioBrowser encourages sending a descriptive User-Agent and distributing requests across multiple servers via their server list discovery. Maintain redundancy and fallbacks.[^1][^3]

---

## Appendices

### Appendix A. RadioBrowser endpoint catalog (selected)

| Category | Path | Description |
|---|---|---|
| Discovery | /json/stations/search | Advanced search with filters (nameExact, countrycode, languageExact, tagList, codec, bitrateMin/Max, has_geo_info, has_extended_info, is_https, order, reverse, offset, limit, hidebroken) |
| Discovery | /json/stations/bycountrycodeexact/{code} | Exact country code filter (e.g., MA) |
| Discovery | /json/stations/bylanguageexact/{language} | Exact language filter (e.g., arabic) |
| Discovery | /json/stations/byname/{name} | Name contains/prefix search |
| Direct play | /json/url/{stationuuid} | Increments click counter and returns direct stream URL (formats: JSON/M3U/PLS) |
| Health & stats | /json/stats | Service statistics |
| Metadata | /json/stations | List all stations (supporting filters) |
| Lists | /json/countries, /json/countrycodes, /json/states, /json/languages, /json/tags | Enumerations for building filter UIs |

Source: RadioBrowser API reference.[^2]

### Appendix B. RadioBrowser station fields (selected)

| Field | Type | Description |
|---|---|---|
| stationuuid | UUID | Unique station identifier |
| name | string | Station name |
| url | URL | User-submitted stream URL |
| url_resolved | URL | Resolved final stream URL (handles redirects/playlists) |
| countrycode | string (ISO 3166-1 alpha‑2) | Country code |
| language / languagecodes | string(s) | Languages spoken; ISO 639 codes where available |
| hls | 0/1 | Indicates HLS distribution |
| lastcheckok | 0/1 | Online/offline status per checks |
| codec | string | Stream codec |
| bitrate | integer | Stream bitrate in kbps |
| clickcount / clicktrend | integer | Popularity metrics |

Source: RadioBrowser API reference.[^2]

### Appendix C. AzuraCast endpoint matrix (public vs. authenticated)

| Area | Public endpoints (examples) | Authenticated endpoints (examples) |
|---|---|---|
| Now playing | Get current track and station profile; schedule | Update now playing manually |
| Media | List on-demand tracks and podcasts | Upload/edit/delete media; manage directories; waveform data |
| Playlists | N/A | Create/update/delete/import/export; order/queue; clone/empty |
| Mounts & HLS | Read mount details | Create/update/delete mount points and HLS streams; intro tracks |
| Queue & requests | Get upcoming queue | Submit song requests; manage queue items |
| Reports | Listener stats and history | Detailed breakdowns by client/country/time; charts |
| Administration | N/A | API keys; user/role management; system service control; backups; global settings |

Source: AzuraCast API documentation (OpenAPI 3.0).[^19][^18]

### Appendix D. Station examples and references

- Radio 2M: Official site, TuneIn listing, and third‑party directory presence (Streema, OnlineRadioBox, myTuner) for verification.[^28][^29][^31][^23]
- Medi 1: Official site, TuneIn listing, and OnlineRadioBox entry for verification and mobile app context.[^27][^30][^32]
- Arabic coverage: Radio.net Arabic-language catalog used for cross-checking.[^21]

---

## References

[^1]: API.radio-browser.info docs (Usage and Network). https://api.radio-browser.info/
[^2]: Radio Browser API Reference. https://docs.radio-browser.info/
[^3]: Radio Browser Stats. https://stats.api.radio-browser.info/
[^4]: Radio Browser Homepage. https://www.radio-browser.info/
[^6]: TuneIn Broadcasters API (AIR) Overview. https://cms.tunein.com/broadcasters/api/
[^8]: TuneIn Streaming API (Unofficial) — Introduction. https://tunein-api.corehacked.com/
[^9]: TuneIn Streaming API (Unofficial) — Getting Started. https://tunein-api.corehacked.com/api-basics/getting-started
[^11]: Radio.net — Arabic Radio Stations. https://www.radio.net/language/arabic
[^12]: SHOUTcast Developer — API Overview. https://directory.shoutcast.com/Developer
[^13]: SHOUTcast DNAS Public Pages (sc-mirror) Docs. https://sc-mirror.shoutca.st/docs/DNAS_Server.html#Public_Pages
[^15]: SHOUTcast Compatible API (Cast Docs). https://cast.readme.io/reference/shoutcast-compatible-api
[^17]: Icecast — Streaming Media Server. http://icecast.org/
[^18]: AzuraCast Docs — About and API Overview. https://www.azuracast.com/docs/
[^19]: AzuraCast API Documentation (OpenAPI 3.0). https://www.azuracast.com/api/index.html
[^20]: AzuraCast GitHub Repository. https://github.com/AzuraCast/AzuraCast
[^21]: Radio.net — Arabic Radio Stations. https://www.radio.net/language/arabic
[^22]: Streema — Morocco Radio Stations. https://streema.com/radios/country/Morocco
[^23]: OnlineRadioBox — Morocco Stations. https://onlineradiobox.com/ma/
[^24]: myTuner Radio — Morocco Stations. https://mytuner-radio.com/radio/country/morocco-stations
[^25]: iHeart Radio JavaScript API (Unofficial). https://github.com/TooTallNate/iheart
[^27]: Medi 1 Radio — Official Site. https://www.medi1.com/
[^28]: Radio 2M — Official Site. https://radio2m.ma/
[^29]: TuneIn — Radio 2M. https://tunein.com/radio/Radio-2M-935-s8694/
[^30]: TuneIn — Medi 1. https://tunein.com/radio/Medi-1-996-s24883/
[^31]: Streema — Radio 2M. https://streema.com/radios/2M_Radio
[^32]: OnlineRadioBox — Medi 1. https://onlineradiobox.com/ma/medi1/
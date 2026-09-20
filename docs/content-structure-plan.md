# Content Structure Plan - Geopolitical Conflict Analysis Web Application

## 1. Material Inventory

**Content Files:**
- `docs/geopolitical_apis.md` (21,857 words, comprehensive API analysis)
- `docs/live_news_apis/live_news_apis.md` (8,245 words, news API comparison)
- `docs/country_geographic_apis/country_geographic_apis.md` (6,890 words, geographic data sources)

**Data Sources:**
- GDELT Project (15-minute event updates, global coverage)
- ACLED (curated conflict events, near real-time)
- UCDP (versioned conflict datasets, periodic updates)
- NewsAPI.org (150k+ sources, 14 languages)
- NewsData.io (10k+ sources, 100+ languages)
- Natural Earth (country boundaries, TopoJSON)
- REST Countries API (country metadata)
- OpenSanctions (sanctions entities)

**Charts/Data Visualizations:**
- Conflict intensity heatmaps (country-level aggregation from ACLED/GDELT)
- Timeline charts (event frequency over time)
- Sanction network graphs (entity relationships from OpenSanctions)
- News sentiment trends (derived from news APIs)

## 2. Website Structure

**Type:** SPA (Single Page Application)

**Reasoning:** 
- Interactive 3D globe is the central hero element requiring persistent state
- Real-time data flows between globe, news sidebar, and country analysis panels
- Single cohesive user journey: explore globe → select country → view details + news
- Approximately 4-5 main interface sections working in unison
- Content volume focused on data visualization rather than static text
- Perfect fit for React.js with state management for API data synchronization

## 3. Section Breakdown

### Section 1: 3D Globe Viewport (Main Interface)
**Purpose**: Primary exploration surface for global conflict visualization

**Content Mapping:**

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
|---------|-------------------|-------------|-------------------|---------------|
| Globe Renderer | 3D Earth Component | `docs/country_geographic_apis.md` L70-90 | Natural Earth TopoJSON boundaries (110m/50m scale) | - |
| Country Polygons | Interactive Mesh Layer | `docs/country_geographic_apis.md` L10-15 | Boundary polygons with ISO 3166-1 codes | - |
| Conflict Intensity Overlay | Heatmap Layer | `docs/geopolitical_apis.md` L70-130 | ACLED event counts aggregated by country | - |
| Global Metrics Bar | Data Display Panel | `docs/geopolitical_apis.md` L10-50 | Real-time conflict event statistics (GDELT 15-min updates) | - |
| Country Labels | Interactive Markers | `docs/country_geographic_apis.md` L95-110 | REST Countries API: country names, ISO codes, capitals | - |

### Section 2: Live News Sidebar (Right Panel)
**Purpose**: Real-time global news stream with geopolitical filtering

**Content Mapping:**

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
|---------|-------------------|-------------|-------------------|---------------|
| News Feed Stream | Scrollable Card List | `docs/live_news_apis/live_news_apis.md` L15-35 | NewsAPI.org: articles with keyword filtering for geopolitics | - |
| News Card | Floating Card Component | `docs/live_news_apis/live_news_apis.md` L150-170 | Article title, source, published time, URL | - |
| Category Filters | Filter Chip Group | `docs/live_news_apis/live_news_apis.md` L115-135 | Boolean queries: "conflict", "diplomacy", "sanctions", "election" | - |
| Source Badges | Metadata Labels | `docs/live_news_apis/live_news_apis.md` L75-95 | Publisher names, language codes | - |

### Section 3: Country Analysis Panel (Modal/Slide-in)
**Purpose**: Detailed conflict data and metadata for selected country

**Content Mapping:**

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
|---------|-------------------|-------------|-------------------|---------------|
| Country Header | Hero Panel | `docs/country_geographic_apis.md` L95-110 | Country name, flag, ISO codes, capital, region | Flag icon via FlagCDN |
| Conflict Timeline | Line Chart | `docs/geopolitical_apis.md` L10-50, L190-210 | ACLED/UCDP: event counts by date, event types, fatalities | - |
| Metadata Grid | Key-Value Display | `docs/country_geographic_apis.md` L95-110 | Population, GDP, government type, languages | - |
| Recent Events List | Event Card Stack | `docs/geopolitical_apis.md` L105-130 | ACLED: recent events with location, date, actors, description | - |
| Sanctions Status | Warning Panel (conditional) | `docs/geopolitical_apis.md` L145-160 | OpenSanctions: entity matches, sanction types | - |
| Related News | News Card Mini List | `docs/live_news_apis/live_news_apis.md` L240-260 | NewsData.io: country-filtered news (region parameter) | - |

### Section 4: Global Filters & Controls (Left Sidebar or Overlay)
**Purpose**: User controls for data filtering and visualization options

**Content Mapping:**

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
|---------|-------------------|-------------|-------------------|---------------|
| Date Range Selector | Date Picker Component | `docs/geopolitical_apis.md` L220-235 | UCDP/ACLED: date filter parameters | - |
| Event Type Filters | Checkbox Group | `docs/geopolitical_apis.md` L250-265 | Event categories: battles, protests, riots, strategic developments | - |
| Intensity Scale Toggle | Slider Component | `docs/geopolitical_apis.md` L10-50 | Conflict Index ranges (ACLED Conflict Index series) | - |
| News Language Filter | Multi-Select Dropdown | `docs/live_news_apis/live_news_apis.md` L75-95 | Language codes (en, es, fr, ar, zh, ru, etc.) | - |
| 3D View Controls | Button Group | N/A | Globe rotation speed, zoom level, layer toggles | - |

### Section 5: Footer / Attribution Bar
**Purpose**: Legal attributions and data source credits

**Content Mapping:**

| Section | Component Pattern | Data Source | Content to Extract | Visual Asset |
|---------|-------------------|-------------|-------------------|---------------|
| Data Attribution | Text Links | `docs/geopolitical_apis.md` L385-430 | ACLED, UCDP, GDELT, Natural Earth, OpenSanctions credits | - |
| API Credits | Link Group | `docs/live_news_apis/live_news_apis.md` L285-305 | NewsAPI.org, NewsData.io attribution requirements | - |
| License Info | Modal Trigger | `docs/country_geographic_apis.md` L160-180 | ODbL (OSM), Public Domain (Natural Earth) | - |

## 4. Content Analysis

**Information Density:** High
- Real-time data streams from 8+ APIs
- 3D visualization with interactive overlays
- Multiple concurrent data panels (globe + sidebar + modal)
- Aggregate event counts: potentially 1000s of conflict events
- News articles: 100-200 articles in sidebar at any time

**Content Balance:**
- Data/Charts: 60% (conflict heatmaps, timelines, metrics)
- Live News Stream: 25% (news sidebar, country news)
- Static Metadata: 10% (country info, labels)
- UI Controls: 5% (filters, navigation)

**Content Type:** Data-driven with real-time streaming

**Key Data Flows:**
1. **Globe → Country Panel**: Click country polygon → fetch ACLED/UCDP events for country → display in modal
2. **Globe → News Sidebar**: Select country → filter NewsData.io by country/region → update news stream
3. **Filters → Globe**: Adjust date range/event types → re-aggregate GDELT/ACLED data → update heatmap
4. **Background Polling**: GDELT updates every 15 minutes → refresh global metrics bar
5. **Cross-Panel Sync**: All panels share selected country state (React Context/Redux)

**API Integration Points:**
- **Initial Load**: Natural Earth TopoJSON + REST Countries metadata
- **Globe Render**: ACLED/GDELT aggregated by country (cached, 15-min refresh)
- **Country Selection**: ACLED event API + UCDP API (paginated) + OpenSanctions match API
- **News Sidebar**: NewsAPI.org polling (60-120s intervals) + NewsData.io fallback
- **Real-time Updates**: GDELT Event Database (15-min cadence) for global metrics

**Performance Considerations:**
- TopoJSON boundaries cached client-side (reduce payload size)
- Country-level conflict aggregation pre-computed on backend/worker
- News sidebar: lazy load with infinite scroll
- 3D globe: LOD (Level of Detail) - simplified geometries at distance
- API rate limiting: implement request batching and exponential backoff

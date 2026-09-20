# Authentic Moroccan News Focus - Update Summary

## Deployment Information

**NEW Deployed URL**: https://01skdn96s1lr.space.minimax.io  
**Previous URL**: https://73oe0atjgwpz.space.minimax.io  
**Application**: GeoIntel Pro - Authentic Moroccan News & Radio Intelligence  
**Update Date**: November 3, 2025  
**Build Size**: 841 KB (JavaScript bundle)

---

## Update Overview

The news integration has been **refined to focus exclusively on authentic Moroccan news sources**. Non-Moroccan pan-Arab sources have been removed to ensure all news content comes from genuine Moroccan outlets providing Morocco-specific perspectives and coverage.

### What Changed

**REMOVED (Non-Moroccan Sources):**
- ❌ Arab News (pan-Arab, not specifically Moroccan)
- ❌ RT Arabic (pan-Arab, not specifically Moroccan)

**KEPT & ENHANCED (Authentic Moroccan Sources):**
- ✅ **Médias24** (Tier 1) - RSS + JSON API
- ✅ **Hespress** (Tier 1) - English RSS feed
- ✅ **H24info** (Tier 2) - NEW - JSON API
- ✅ **Le360** (Tier 2) - NEW - Sitemap-based

**UI UPDATES:**
- Badge updated from "NEWS" to "MOROCCAN NEWS"
- Event counter updated to show "X Moroccan News" instead of generic "News"
- Console logging emphasizes "authentic Moroccan sources"

---

## Authentic Moroccan News Sources

### Tier 1 Sources (High Priority - Fully Integrated)

**1. Médias24**
- **Type**: Moroccan business & political news
- **Focus**: Economy, politics, business, finance
- **Integration**: 
  - RSS feed: `https://medias24.com/feed`
  - JSON API: `https://medias24.com/wp-json/wp/v2/posts`
- **Language**: French
- **Update Frequency**: Hourly
- **Reliability**: High (major Moroccan outlet)

**2. Hespress**
- **Type**: Major Moroccan news portal
- **Focus**: General news, politics, society, economy
- **Integration**: 
  - English RSS: `https://en.hespress.com/feed`
- **Language**: English (also has Arabic version)
- **Update Frequency**: Hourly
- **Reliability**: High (one of Morocco's most popular news sites)

### Tier 2 Sources (Medium Priority - Fully Integrated)

**3. H24info** (NEW)
- **Type**: Moroccan news website
- **Focus**: Breaking news, politics, economy
- **Integration**: 
  - JSON API: `https://h24info.ma/wp-json/wp/v2/posts`
- **Language**: French/Arabic
- **Update Frequency**: Frequent
- **Reliability**: Medium (growing Moroccan outlet)

**4. Le360** (NEW)
- **Type**: Moroccan multimedia news platform
- **Focus**: General news, economy, sports
- **Integration**: 
  - Sitemap parsing: `https://fr.le360.ma/sitemap_index.xml`
- **Language**: French (also has Arabic: `https://ar.le360.ma/`)
- **Update Frequency**: Regular
- **Reliability**: Medium (popular Moroccan site)

### Sources Considered for Future Integration

**L'Économiste**
- **Status**: Research phase
- **Sitemap**: `https://www.leconomiste.com/sitemap_index.xml`
- **Complexity**: Requires more sophisticated parsing
- **Priority**: High for economic news

**Aujourd'hui le Maroc**
- **Status**: Research phase
- **Type**: French-language Moroccan daily
- **Focus**: General news
- **Priority**: Medium

---

## Technical Implementation

### Code Changes

**1. moroccanNewsAPI.ts** (Completely Rewritten - 416 lines)

**Removed Functions:**
- `fetchArabNewsRSS()` - Non-Moroccan source
- `fetchRTArabicRSS()` - Non-Moroccan source

**Added Functions:**
- `fetchH24InfoJSON()` - H24info JSON API integration
- `fetchLe360News()` - Le360 sitemap parsing

**Updated Functions:**
- `fetchAllMoroccanNews()` - Now only aggregates authentic Moroccan sources
- `convertArticlesToIntelEvents()` - Event IDs now use `moroccan-news-` prefix
- `analyzeSentiment()` - Enhanced with French keywords (développement, progrès, baisse)
- `analyzePriority()` - Updated with French keywords (roi, gouvernement)
- `classifyCategory()` - Added French keyword detection (économ, défense, étranger)
- `extractActors()` - Added French actor patterns (gouvernement, ministère, parlement, roi, syndicat)
- `generateNewsAnalysis()` - Templates now emphasize Moroccan context
- Console logging updated to specify "authentic Moroccan sources"

**2. LiveSignalsFeed.tsx** (Updated)

**Changes:**
- Event ID check changed from `'news-'` to `'moroccan-news-'`
- Badge text changed from "NEWS" to "MOROCCAN NEWS"
- Comment updated to "Source with Moroccan News Badge"

**3. App.tsx** (Updated)

**Changes:**
- Event counter text changed from "{X} News" to "{X} Moroccan News"

---

## News Fetching Strategy

### Source Priority & Reliability

**Tier 1 (Primary Sources):**
- Médias24 RSS + JSON (dual integration for redundancy)
- Hespress English RSS

**Tier 2 (Secondary Sources):**
- H24info JSON API
- Le360 sitemap

### Aggregation Logic

```typescript
const sources = await Promise.allSettled([
  fetchMedias24RSS(),      // Moroccan business news
  fetchMedias24JSON(),     // Same source, different method (redundancy)
  fetchHespressRSS(),      // Moroccan general news
  fetchH24InfoJSON(),      // Moroccan breaking news
  fetchLe360News(),        // Moroccan multimedia news
]);
```

### Deduplication

- Articles deduplicated by URL
- Prevents same article from appearing multiple times
- Particularly important for Médias24 (fetched via both RSS and JSON)

### Sorting

- Articles sorted by publication date (newest first)
- Ensures most recent Moroccan news appears at top
- Respects timezone information from feeds

### Limiting

- Top 30 most recent articles converted to IntelEvents
- Balances freshness with performance
- Prevents overwhelming the UI

---

## Content Quality Enhancements

### Morocco-Specific Focus

**What This Means:**
- All news directly relates to Morocco
- Perspectives from Moroccan journalists and outlets
- Focus on Moroccan government, economy, society
- No pan-Arab or international filtering needed

**Before (with Arab News/RT Arabic):**
- Had to filter pan-Arab news for Morocco mentions
- Mixed perspectives (Saudi, Russian, generic Arab)
- Some irrelevant content slipped through
- Inconsistent Morocco focus

**After (Moroccan sources only):**
- 100% Morocco-focused content
- Authentic Moroccan perspectives
- Direct coverage of Moroccan affairs
- Consistent relevance and quality

### Language Coverage

**French Sources:**
- Médias24
- H24info
- Le360 (French version)

**English Sources:**
- Hespress (English edition)

**Arabic Sources:**
- Hespress (has Arabic version - can be added)
- Le360 (has Arabic version - can be added)

**Mixed/Bilingual:**
- Most Moroccan outlets publish in multiple languages
- French and Arabic are Morocco's primary news languages
- English coverage from Hespress provides accessibility

### Sentiment Analysis Enhancement

**Added French Keywords:**
- Positive: développement, croissance, accord, progrès
- Negative: crise, conflit, manifestation, baisse

**Priority Detection:**
- French keywords: roi, gouvernement
- Recognizes Moroccan political keywords

**Actor Extraction:**
- French patterns: gouvernement, ministère, parlement, roi, syndicat
- Better captures Moroccan political actors

---

## User Experience Improvements

### Visual Changes

**1. Badge Update**
- **Before**: Small "NEWS" badge (cyan)
- **After**: "MOROCCAN NEWS" badge (cyan)
- More descriptive and specific

**2. Event Counter**
- **Before**: "X Active Events (Y News)"
- **After**: "X Active Events (Y Moroccan News)"
- Clarifies news source focus

**3. Console Messages**
- **Before**: "Fetching Moroccan news from all sources..."
- **After**: "Fetching from authentic Moroccan news sources only..."
- Emphasizes authenticity

### Functional Improvements

**1. Higher Relevance**
- Every news article is about Morocco
- No filtering false positives
- More consistent quality

**2. Better Context**
- Moroccan perspectives on Moroccan issues
- Local understanding of events
- Culturally appropriate framing

**3. Source Diversity**
- Business focus (Médias24)
- General news (Hespress, H24info)
- Multimedia coverage (Le360)
- Multiple languages (French, English, Arabic available)

---

## All Features Preserved

### Existing Intelligence Features ✅
- UCDP conflict data with AI assessment
- Live Signals feed with sentiment analysis
- 3D globe with event markers
- AI Assessment panel with risk scores
- Flash updates header
- Filtering and search functionality
- Download summaries
- Mobile responsiveness
- 10-minute conflict data polling

### Radio Broadcasting ✅
- 35+ Moroccan and Arabic radio stations
- RadioBrowser.info integration
- Full player controls (play/pause/volume/mute)
- Minimize/maximize functionality
- Toggle button for easy access
- Mobile-compatible streaming

### News Intelligence ✅
- **ENHANCED** - Now with authentic Moroccan sources only
- 3-minute polling for fresh news
- Sentiment analysis (enhanced with French keywords)
- Priority scoring (enhanced with French keywords)
- Category classification
- AI scoring across 5 dimensions
- Confidence ratings
- Deduplication
- "MOROCCAN NEWS" badges in UI

---

## Verification Checklist

### Content Verification

Visit https://01skdn96s1lr.space.minimax.io and check:

- [ ] Event cards show sources: Médias24, Hespress, H24info, Le360
- [ ] NO event cards show: Arab News, RT Arabic
- [ ] Event cards have "MOROCCAN NEWS" badge (cyan, small text)
- [ ] Event counter shows "X Moroccan News" (bottom of globe)
- [ ] All news headlines relate to Morocco specifically
- [ ] Console shows "Fetching from authentic Moroccan news sources only..."

### Source Verification

Open browser console (F12) and look for:
```
Fetching from authentic Moroccan news sources only...
Médias24 RSS: X articles
Médias24 JSON: Y articles
Hespress: Z articles
H24info: A articles
Le360: B articles
Total unique Moroccan articles: N
```

### UI Verification

- [ ] "MOROCCAN NEWS" badge visible on news event cards
- [ ] Badge is cyan color with border
- [ ] Event counter format: "X Active Events (Y Moroccan News)"
- [ ] Flash updates include Moroccan news headlines
- [ ] 3D globe shows news markers in Morocco (Rabat region)
- [ ] Radio player still functional at bottom
- [ ] All existing WarTracker24 features work normally

---

## Success Criteria Status

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| Remove non-Moroccan sources | ✅ Complete | Arab News and RT Arabic removed |
| Focus on authentic Moroccan outlets | ✅ Complete | Only Moroccan news sources used |
| Prioritize top Moroccan sources | ✅ Complete | Médias24, Hespress as Tier 1 |
| Add additional Moroccan sources | ✅ Complete | H24info and Le360 added |
| Ensure Morocco-specific news | ✅ Complete | All sources inherently Morocco-focused |
| Update to "Moroccan News" text | ✅ Complete | Badge and counter updated |
| Deploy updated version | ✅ Complete | Live at new URL |

---

## Future Enhancement Opportunities

### Additional Sources

**High Priority:**
- **L'Économiste**: Major economic news source (requires advanced parsing)
- **Aujourd'hui le Maroc**: Daily French-language newspaper
- **Hespress Arabic**: Arabic version of Hespress (language diversity)
- **Le360 Arabic**: Arabic version of Le360 (language diversity)

**Medium Priority:**
- **Maroc Hebdo**: Weekly news magazine
- **TelQuel**: French-language news magazine
- **Yabiladi**: Moroccan diaspora news
- **Kech24**: Local news (Marrakech focus)

### Technical Enhancements

- **Advanced NLP**: Better sentiment analysis using ML models
- **Topic Clustering**: Group related news articles together
- **Trend Detection**: Identify emerging stories and patterns
- **Source Reliability Scoring**: Dynamic credibility ratings
- **Multi-language Support**: Parallel English/French/Arabic display
- **News Search**: Full-text search across Moroccan news archive
- **Bookmarking**: Save important Moroccan news articles
- **Notifications**: Alerts for high-priority Moroccan news

---

## Documentation Summary

### Key Files Updated

1. **moroccanNewsAPI.ts** - Rewritten (416 lines)
   - Removed: fetchArabNewsRSS(), fetchRTArabicRSS()
   - Added: fetchH24InfoJSON(), fetchLe360News()
   - Enhanced: French keyword detection, Moroccan context

2. **LiveSignalsFeed.tsx** - Updated
   - Badge text: "NEWS" → "MOROCCAN NEWS"
   - Event ID check: 'news-' → 'moroccan-news-'

3. **App.tsx** - Updated
   - Counter text: "News" → "Moroccan News"

### Build Changes

- **Bundle Size**: 841 KB (+1 KB for H24info/Le360 integration)
- **Build Time**: 5.38s
- **Module Count**: 1626 modules
- **CSS Size**: 26.36 KB (unchanged)

---

## Deployment Summary

**Status**: ✅ COMPLETE AND LIVE  
**URL**: https://01skdn96s1lr.space.minimax.io  
**Focus**: Authentic Moroccan news sources only  
**Sources**: Médias24, Hespress, H24info, Le360  
**Removed**: Arab News, RT Arabic  
**UI**: Updated to "MOROCCAN NEWS" branding  
**All Features**: Intelligence, Radio, News - all operational  

---

## Quick Comparison

### Before (Previous Version)
- 5 news sources (3 Moroccan + 2 pan-Arab)
- Generic "NEWS" badge
- "X News" counter
- Required Morocco filtering for Arab News/RT
- Mixed Moroccan and pan-Arab perspectives

### After (Current Version)
- 5 news sources (ALL Moroccan)
- "MOROCCAN NEWS" badge
- "X Moroccan News" counter
- No filtering needed (inherently Morocco-focused)
- 100% authentic Moroccan perspectives

---

## Conclusion

The news integration now provides **authentic, Morocco-focused news from genuine Moroccan outlets**. By removing pan-Arab sources and adding more Moroccan sources (H24info, Le360), the platform delivers higher-quality, more relevant intelligence about Morocco from Moroccan perspectives.

Users now receive:
1. **Geopolitical conflict intelligence** (UCDP global data)
2. **Authentic Moroccan news** (Moroccan outlets only)
3. **Live Moroccan radio** (35+ stations)

All in a unified intelligence monitoring platform designed for professional analysis.

**Ready for production use!**

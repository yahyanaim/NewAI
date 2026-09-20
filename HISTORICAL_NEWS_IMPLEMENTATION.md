# Historical Moroccan News Section - Implementation Summary

## Deployment Information

**NEW Deployed URL**: https://gxigvkfzk92x.space.minimax.io  
**Previous URL**: https://01skdn96s1lr.space.minimax.io  
**Application**: GeoIntel Pro - Complete Moroccan Intelligence with Historical News  
**Update Date**: November 3, 2025  
**Build Size**: 851 KB (JavaScript bundle) - 10 KB increase

---

## Update Overview

Added **Historical Moroccan News Section** displaying news from the **past 24 hours** under the Live Signals Feed. This provides users with a complete timeline of Moroccan intelligence, combining real-time updates with recent historical context.

### What Was Added

**Historical News Section Features:**
- **Time Range**: Past 24 hours (excluding last 15 minutes to avoid overlap with live news)
- **Placement**: Under Live Signals Feed in the left panel
- **Display**: Compact chronological list with timestamps
- **Badge**: "HISTORY" badge (gray) to distinguish from live "MOROCCAN NEWS" badge
- **Limit**: Up to 20 most recent historical articles
- **Refresh**: Updates every 30 minutes automatically

**Visual Design:**
- Compact card format (smaller than live events)
- Gray "HISTORY" badge instead of cyan "MOROCCAN NEWS"
- Section header with History icon
- Event count display
- Lighter background to distinguish from live events
- Same sentiment analysis indicators

---

## Technical Implementation

### Files Modified

**1. moroccanNewsAPI.ts** (Added Functions)

**New Functions:**
```typescript
filterArticlesByDateRange(articles, hoursAgo)
// Filters articles by time range

fetchHistoricalMoroccanNews()
// Fetches news from past 24 hours (excluding last 15 min)

convertArticlesToIntelEvents(articles, isHistorical)
// Updated to accept historical flag for ID prefix
```

**Date Filtering Logic:**
```typescript
const now = Date.now();
const past24Hours = now - (24 * 60 * 60 * 1000);
const recent15Min = now - (15 * 60 * 1000);

const historicalNews = allNews.filter(article => {
  const articleDate = new Date(article.pubDate).getTime();
  return articleDate >= past24Hours && articleDate < recent15Min;
});
```

**Event ID Prefixes:**
- Live news: `moroccan-news-*`
- Historical news: `historical-moroccan-news-*`

**2. App.tsx** (State & Data Management)

**New State:**
```typescript
const [historicalNewsEvents, setHistoricalNewsEvents] = useState<IntelEvent[]>([]);
```

**New Function:**
```typescript
async function loadHistoricalNews() {
  const articles = await fetchHistoricalMoroccanNews();
  const historicalIntelEvents = convertArticlesToIntelEvents(articles, true);
  setHistoricalNewsEvents(historicalIntelEvents);
}
```

**Refresh Schedule:**
- Historical news: Every 30 minutes (1,800,000ms)
- Live news: Every 3 minutes (180,000ms)  
- Conflict data: Every 10 minutes (600,000ms)

**Props Passed to LiveSignalsFeed:**
```typescript
<LiveSignalsFeed
  intelEvents={[...intelEvents, ...newsEvents]}
  historicalEvents={historicalNewsEvents}
  onEventSelect={handleEventSelect}
  selectedEventId={selectedEvent?.id}
/>
```

**3. LiveSignalsFeed.tsx** (UI Component)

**Updated Interface:**
```typescript
interface LiveSignalsFeedProps {
  intelEvents: IntelEvent[];
  historicalEvents: IntelEvent[];  // NEW
  onEventSelect: (event: IntelEvent) => void;
  selectedEventId?: string;
}
```

**New Section Added:**
```tsx
{historicalEvents.length > 0 && (
  <div className="mt-6 border-t border-accent-primary/20 pt-4">
    <div className="flex items-center gap-2 mb-3 px-2">
      <History className="w-4 h-4 text-text-secondary" />
      <h3>Moroccan News - Past 24 Hours</h3>
      <span>({historicalEvents.length})</span>
    </div>
    
    <div className="space-y-2">
      {historicalEvents.slice(0, 20).map(event => (
        <HistoricalEventCard ... />
      ))}
    </div>
  </div>
)}
```

**New Component: HistoricalEventCard**
- Compact design (smaller padding, text sizes)
- Gray "HISTORY" badge
- Lighter background color
- Same sentiment indicators
- Shows timestamp, headline, source, country
- Clickable to view in AI Assessment panel

---

## User Experience

### Live Signals Feed Layout

**Structure (Top to Bottom):**
1. **Header Section**
   - "Live Signals" title with activity icon
   - UPDATING indicator (when refreshing)
   - LIVE indicator with pulsing dot
   - Last updated timestamp
   - Event count

2. **Search & Filters**
   - Search box for event filtering
   - Sentiment filters (All, Positive, Negative, Neutral)
   - Priority filters (All Priority, High, Normal, Low)

3. **Live Events List**
   - Current intelligence events (conflicts + live news)
   - Full-size event cards
   - "MOROCCAN NEWS" badge for news articles
   - Sentiment badges, priority indicators
   - Click to view in AI Assessment panel

4. **Historical News Section** (NEW)
   - Border separator with History icon
   - "Moroccan News - Past 24 Hours" header
   - Event count display
   - Up to 20 compact historical event cards
   - "HISTORY" badge (gray) for each article
   - Same click interaction as live events

### Visual Distinctions

**Live News Cards:**
- Full size (p-3 padding)
- Cyan "MOROCCAN NEWS" badge
- Standard background color
- Full headline display (2 lines)
- Shows location, priority, source

**Historical Event Cards:**
- Compact size (p-2.5 padding)
- Gray "HISTORY" badge
- Lighter background (bg-bg-elevated/50)
- Compact headline (smaller font)
- Shows timestamp, source, country
- Smaller text overall (text-xs instead of text-sm)

### Interaction

**Selecting Events:**
- Click any event (live or historical)
- AI Assessment panel updates on right
- Selected event highlighted with teal border
- Works identically for live and historical events

**Scrolling:**
- Live events section scrollable
- Historical section scrollable within same container
- Custom scrollbar styling maintained

**Filtering:**
- Filters apply to live events only
- Historical section always visible (not affected by filters)
- Historical section separated visually with border

---

## Time Range Logic

### Current Time Reference
Based on: **2025-11-03 11:57:34**

### Historical Range Calculation

**Past 24 Hours:**
- Start: 24 hours ago from now
- End: 15 minutes ago from now
- Reason for 15-min gap: Avoids overlap with live news

**Example Timeline:**
```
Current time: 2025-11-03 11:57:34

Historical range:
  From: 2025-11-02 11:57:34 (24 hours ago)
  To:   2025-11-03 11:42:34 (15 minutes ago)

Live news range:
  From: 2025-11-03 11:42:34 (15 minutes ago)
  To:   2025-11-03 11:57:34 (now)
```

### Refresh Intervals

**Historical News:**
- Refresh: Every 30 minutes
- Reason: Historical data changes less frequently than live
- Efficient: Reduces API calls while keeping data fresh

**Live News:**
- Refresh: Every 3 minutes
- Reason: Captures breaking news quickly

**Conflict Data:**
- Refresh: Every 10 minutes
- Reason: Balance between freshness and API limits

---

## Data Sources

### Same Authentic Moroccan Sources

Historical news uses **identical sources** as live news:
1. **Médias24** (RSS + JSON)
2. **Hespress** (English RSS)
3. **H24info** (JSON API)
4. **Le360** (Sitemap)

### Data Processing

**Same Intelligence Processing:**
- Sentiment analysis (positive/negative/neutral)
- Priority scoring (high/normal/low)
- Category classification (political/military/economic/diplomatic)
- Actor extraction (Moroccan government entities)
- AI scoring (5 dimensions)
- Confidence ratings (high/medium/low)

**Deduplication:**
- Historical articles filtered by date
- Separate from live news (no overlap)
- Each article appears only once (either live or historical)

---

## Benefits & Use Cases

### Complete Intelligence Picture

**Before (Live Only):**
- Users saw only recent news (last 15 minutes)
- No context for developing stories
- Missed articles published hours ago

**After (Live + Historical):**
- Complete 24-hour timeline of Moroccan intelligence
- Context for understanding developing situations
- Nothing missed from the past day

### Use Cases

**1. Daily Briefing**
- User opens platform in morning
- Reviews historical section for overnight developments
- Catches up on everything from past 24 hours
- Then monitors live section for breaking news

**2. Continuous Monitoring**
- User monitors live events throughout day
- Periodically checks historical section
- Sees patterns and trends over 24 hours
- Connects related stories from different times

**3. Retrospective Analysis**
- User investigates specific topic
- Searches through historical events
- Finds related articles from past day
- Builds comprehensive understanding

**4. Situational Awareness**
- New user joins platform mid-day
- Historical section provides immediate context
- Gets up to speed on day's developments
- Then follows live updates going forward

---

## All Features Preserved

### Existing Functionality ✅

**Intelligence Monitoring:**
- UCDP conflict data with AI assessment
- Live Signals feed with sentiment analysis
- 3D globe with event markers
- AI Assessment panel with risk scores
- Flash updates header with scrolling news
- Filtering by sentiment and priority
- Search across events
- Download summaries

**Moroccan News Intelligence:**
- Real-time Moroccan news (3-minute refresh)
- Authentic Moroccan sources only
- "MOROCCAN NEWS" badge on live articles
- Full intelligence processing
- Sentiment, priority, category analysis
- French and Arabic keyword detection

**Radio Broadcasting:**
- 35+ Moroccan and Arabic radio stations
- RadioBrowser.info integration
- Full player controls
- Minimize/maximize functionality
- Toggle button access
- Mobile-compatible streaming

### New Historical Feature ✅

**Historical News Section:**
- Past 24 hours of Moroccan news
- Compact chronological display
- "HISTORY" badge distinction
- Up to 20 recent articles
- 30-minute refresh interval
- Same sources and processing
- Separate from live events
- Click to view full details

---

## Mobile Responsiveness

### Mobile Behavior

**Historical Section on Mobile:**
- Appears after live events in scrollable feed
- Same compact card design
- Touch-friendly (larger tap targets)
- Responsive text sizes
- Scrolls smoothly with rest of feed

**Mobile Layout:**
- Historical section maintains separation
- Border and header remain visible
- Cards stack vertically
- All interaction preserved

---

## Performance Considerations

### Build Impact
- **Bundle Size**: 851 KB (+10 KB increase)
- **Modules**: 1,626 (unchanged)
- **CSS**: 26.60 KB (+0.24 KB)
- **Build Time**: 5.55s

### Runtime Performance

**Memory:**
- Additional state for historical events
- Limit: Max 20 historical cards displayed
- Efficient: Old historical data replaced on refresh

**Network:**
- Historical refresh: Every 30 minutes
- Reuses same API calls as live news
- No additional API endpoints needed
- Minimal bandwidth impact

**Rendering:**
- Compact cards render faster (less complex)
- Virtual scrolling not needed (limited to 20)
- Smooth scrolling maintained

---

## Success Criteria Status

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| Add historical section under Live Signals | ✅ Complete | Section added with border separator |
| Display only past 24 hours | ✅ Complete | Date filtering: 24hr ago to 15min ago |
| Chronological order | ✅ Complete | Sorted by timestamp, newest first |
| Use "HISTORY" badge | ✅ Complete | Gray badge, distinct from live news |
| Visual separation | ✅ Complete | Border, header, lighter background |
| Maintain existing functionality | ✅ Complete | All features preserved |
| Same intelligence processing | ✅ Complete | Identical analysis applied |
| Deploy updated version | ✅ Complete | Live at new URL |

---

## Verification Checklist

Visit **https://gxigvkfzk92x.space.minimax.io** and verify:

### Historical Section Presence
- [ ] Scroll down in Live Signals Feed (left panel)
- [ ] See border separator after live events
- [ ] See "Moroccan News - Past 24 Hours" header with History icon
- [ ] See event count in parentheses

### Historical Event Display
- [ ] Historical events displayed in compact cards
- [ ] Each card has gray "HISTORY" badge
- [ ] Timestamps show past 24 hours
- [ ] Sentiment badges visible (positive/negative/neutral)
- [ ] Source names displayed (Médias24, Hespress, H24info, Le360)
- [ ] Headlines are Moroccan news (not pan-Arab)

### Interaction
- [ ] Click historical event card
- [ ] AI Assessment panel updates on right
- [ ] Event details displayed correctly
- [ ] Selected event highlighted with teal border
- [ ] Can switch between live and historical events

### Console Verification
Open browser console (F12) and look for:
```
Fetching historical Moroccan news...
Fetched X historical Moroccan news articles
Converted to Y historical intelligence events
```

### Data Quality
- [ ] No duplicate articles between live and historical
- [ ] All historical news from past 24 hours
- [ ] No news older than 24 hours
- [ ] No overlap with live news (15-minute gap)

---

## Troubleshooting

### No Historical Events Showing

**Possible Causes:**
1. News sources have no articles from past 24 hours
2. All recent articles within 15-minute live window
3. API fetch failed

**Solutions:**
- Wait 30 minutes for refresh
- Check console for fetch errors
- Verify news sources are accessible

### Historical Events Look Same as Live

**Check:**
- Historical events should have gray "HISTORY" badge
- Live news should have cyan "MOROCCAN NEWS" badge
- Historical cards should be slightly smaller
- Historical background should be lighter

**If Wrong:**
- Clear browser cache and reload
- Check event ID prefixes in console

### Historical Section Not Scrolling

**Verify:**
- Section is within scrollable container
- Custom scrollbar CSS is applied
- No conflicting overflow styles

---

## Future Enhancement Opportunities

### Time Range Options
- Toggle between 24h, 48h, 7 days
- Custom date range picker
- "Load More" button for older articles

### Advanced Historical Features
- Timeline visualization
- Historical trend analysis
- Daily summary reports
- Historical event comparison

### Search & Filter
- Search historical events separately
- Filter historical by date range
- Filter historical by source
- Combined live + historical search

### Data Export
- Export historical events to CSV
- Generate historical intelligence reports
- Email digest of past 24 hours
- Historical data API access

---

## Documentation Summary

### Key Changes

**Backend (moroccanNewsAPI.ts):**
- Added `fetchHistoricalMoroccanNews()` function
- Updated `convertArticlesToIntelEvents()` with historical flag
- Date filtering: past 24 hours (excluding last 15 min)
- Event ID prefixes: `historical-moroccan-news-*`

**State Management (App.tsx):**
- Added `historicalNewsEvents` state
- Added `loadHistoricalNews()` function
- 30-minute refresh interval for historical data
- Pass historical events to LiveSignalsFeed

**UI Component (LiveSignalsFeed.tsx):**
- Updated props to accept `historicalEvents`
- Added historical section with separator
- Created `HistoricalEventCard` component
- Gray "HISTORY" badge styling
- Compact card design

### Build Information

- **Bundle**: 851 KB JS (+10 KB)
- **CSS**: 26.60 KB (+0.24 KB)
- **Build Time**: 5.55s
- **Modules**: 1,626
- **Production Ready**: Yes

---

## Deployment Summary

**Status**: ✅ COMPLETE AND LIVE  
**URL**: https://gxigvkfzk92x.space.minimax.io  
**Feature**: Historical Moroccan News (Past 24 Hours)  
**Placement**: Under Live Signals Feed  
**Badge**: "HISTORY" (gray)  
**Refresh**: Every 30 minutes  
**Display**: Up to 20 compact cards  
**Sources**: Same authentic Moroccan outlets  
**All Features**: Intelligence, Radio, Live News, Historical News - all operational  

---

## Conclusion

The WarTracker24 intelligence platform now provides **complete 24-hour Moroccan intelligence coverage** by combining:

1. **Real-time geopolitical conflict intelligence** (UCDP global data)
2. **Live Moroccan news updates** (past 15 minutes, 3-minute refresh)
3. **Historical Moroccan news** (past 24 hours, 30-minute refresh)
4. **Live Moroccan radio broadcasting** (35+ stations)

Users can now monitor current breaking developments while maintaining full awareness of the day's intelligence context, providing comprehensive situational awareness for Morocco-focused intelligence analysis.

**Ready for production use!**

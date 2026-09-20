# GeoIntel Pro - Manual Testing Guide

## Deployed Application
**Enhanced URL**: https://nei3lpyczsoa.space.minimax.io

## What Was Enhanced

### Data Authenticity Improvements

The application now uses **real UCDP conflict data** with sophisticated intelligence processing instead of mock data:

1. **Enhanced Intelligence API** (`src/lib/intelAPI.ts`)
   - Transforms real UCDP conflict events into IntelEvent format
   - Performs sentiment analysis based on event characteristics
   - Calculates AI assessment scores from actual fatalities and intensity
   - Generates contextual AI analysis text
   - Maps geographic coordinates accurately

2. **Sentiment Analysis Algorithm**
   - **Positive**: Peace agreements, ceasefires, diplomatic progress, zero fatalities
   - **Negative**: High fatalities (>10), violence, attacks, strikes  
   - **Neutral**: Standard political events, announcements

3. **Priority Calculation**
   - **High**: >20 fatalities OR critical/high intensity conflicts
   - **Normal**: 5-20 fatalities OR medium intensity
   - **Low**: <5 fatalities OR low intensity

4. **AI Scoring (0-100 scale)**
   - **Geopolitical Impact**: Based on priority + fatality factor
   - **Geoeconomic**: Derived from base event assessment
   - **Security**: Elevated for negative sentiment + high fatalities
   - **Diplomatic**: Higher for positive events, lower for negative
   - **Stability**: Inverse correlation with conflict intensity

5. **Real Data Sources**
   - UCDP Georeferenced Event Dataset (GED) API
   - REST Countries for geographic data
   - Curated November 2025 geopolitical events as fallback

## Comprehensive Manual Testing Checklist

### 1. Initial Load (2 min)
- [ ] Page loads within 3 seconds
- [ ] No console errors in browser DevTools
- [ ] Three-column layout visible (left/center/right panels)
- [ ] Dark blue theme with teal accents present
- [ ] Header "GeoIntel Pro" displays with gradient effect

### 2. Flash Updates Header (2 min)
- [ ] "FLASH UPDATES" badge visible in red
- [ ] Headlines scroll from right to left continuously
- [ ] Scrolling pauses when hovering over ticker
- [ ] "LIVE" indicator shows green pulse animation
- [ ] Current time updates in header (HH:MM format)
- [ ] Headlines include "BREAKING:" prefix for high-priority negative events

### 3. Live Signals Feed - Left Panel (5 min)
**Event Cards:**
- [ ] At least 10-15 event cards visible
- [ ] Each card shows timestamp in "DD MMM YYYY HH:MM" format
- [ ] Headlines are clear and contextual (not generic)
- [ ] Sentiment badges display correctly:
  - Green badge = POSITIVE
  - Red badge = NEGATIVE  
  - Orange badge = NEUTRAL
- [ ] Priority badges show HIGH/NORMAL/LOW
- [ ] Source attribution appears (Reuters, AP News, etc.)

**Filtering:**
- [ ] Search box: Type "Syria" - events filter to show only Syria-related items
- [ ] Clear search - all events return
- [ ] Click "Positive" sentiment filter - only positive events show
- [ ] Click "Negative" sentiment filter - only negative events show
- [ ] Click "Neutral" sentiment filter - only neutral events show
- [ ] Click "All" sentiment filter - all events return
- [ ] Click "High" priority filter - only high priority events show
- [ ] Combine filters: "High" + "Negative" shows only high-priority negative events

**Interaction:**
- [ ] Click first event card - card highlights with teal border glow
- [ ] Scroll panel independently from other panels
- [ ] LIVE indicator pulse animation active

### 4. 3D Globe - Center Panel (5 min)
**Globe Rendering:**
- [ ] 3D Earth displays with continents visible
- [ ] Blue-tinted globe with slight glow
- [ ] Country borders visible as faint lines
- [ ] Background is dark blue (#0A1425)

**Event Markers:**
- [ ] Colored dots visible on globe surface
- [ ] Green dots present (positive sentiment events)
- [ ] Red dots present (negative sentiment events)
- [ ] Orange dots present (neutral sentiment events)
- [ ] Markers pulse/animate slightly
- [ ] Markers positioned at realistic locations (Middle East, Africa, Europe, Asia)

**Interactions:**
- [ ] Auto-rotation: Globe rotates slowly on its own
- [ ] Manual drag: Click and drag to rotate globe manually
- [ ] Auto-rotation stops while dragging
- [ ] Click on event marker - marker selection highlights
- [ ] Cursor changes to grab/grabbing during interaction

**Legend:**
- [ ] Bottom legend shows sentiment color key
- [ ] Event count displays (e.g., "12 Active Events")

### 5. AI Assessment Panel - Right Panel (7 min)
**Event Header:**
- [ ] Selected event headline displays prominently
- [ ] Timestamp shows in correct format
- [ ] Sentiment badge matches left panel selection
- [ ] Priority badge displays correctly
- [ ] Geographic location shown (country, region)

**AI Event Assessment Section:**
- [ ] "AI EVENT ASSESSMENT" header visible with shield icon
- [ ] 5 progress bars present:
  1. GEOPOLITICAL (blue icon)
  2. GEOECONOMIC (purple icon)  
  3. SECURITY (red icon)
  4. DIPLOMATIC (green icon)
  5. STABILITY (orange icon)
- [ ] Each bar shows score out of 100 (e.g., "75/100")
- [ ] Progress bars animate when event changes
- [ ] Bar colors match score ranges:
  - Green for 71-100
  - Yellow for 41-70
  - Red for 0-40

**Additional Content:**
- [ ] "Key Actors" section shows actor tags (Government, Opposition, etc.)
- [ ] "Affected Regions" shows region tags (Middle East, East Africa, etc.)
- [ ] "AI Agent Analysis" shows paragraph of contextual analysis
- [ ] Confidence indicator displays (HIGH/MEDIUM/LOW CONFIDENCE)
- [ ] Source attribution at bottom (source name + category)

**Interaction:**
- [ ] Panel scrolls independently
- [ ] Select different events from left panel - content updates
- [ ] Close button (X) functions (may clear selection)

### 6. Data Authenticity Verification (5 min)
**Check for Real Data Indicators:**
- [ ] Headlines mention specific locations (not just "Country X")
- [ ] Fatality numbers appear in some headlines
- [ ] Event types vary (State-based conflict, Non-state conflict, etc.)
- [ ] AI analysis text is contextual and specific to the event
- [ ] Scores vary realistically (not all the same)
- [ ] Actor names are specific (not just "Actor 1", "Actor 2")
- [ ] Timestamps are staggered (not all the same time)

**Cross-Panel Consistency:**
- [ ] Select event in left panel - globe highlights same location
- [ ] Click globe marker - left panel highlights event
- [ ] Right panel always shows details of selected event
- [ ] Flash updates ticker shows events from the same dataset

### 7. Visual Theme & Polish (3 min)
**Colors:**
- [ ] Background: Deep dark blue (not pure black)
- [ ] Accents: Teal/cyan throughout (#00CED1)
- [ ] Borders: Teal with transparency
- [ ] Text: White/light gray (readable)

**Animations:**
- [ ] Marquee scrolling is smooth
- [ ] LIVE indicator pulses continuously
- [ ] Progress bars fill smoothly
- [ ] Event card selection transitions smoothly
- [ ] Globe rotation is fluid

**Typography:**
- [ ] Font is modern and readable (Inter)
- [ ] Hierarchy clear (headlines > body > captions)
- [ ] No text overflow or clipping

### 8. Responsive Design (Mobile - 3 min)
**Desktop View (>1024px):**
- [ ] Three panels side-by-side
- [ ] All panels visible simultaneously
- [ ] Footer attribution visible

**Tablet/Mobile (<1024px):**
- [ ] Layout stacks vertically
- [ ] Globe on top (60% height)
- [ ] Event feed or assessment below (40% height)
- [ ] Touch interactions work on mobile

### 9. Performance (2 min)
- [ ] Page loads in < 5 seconds
- [ ] Interactions feel responsive (< 100ms delay)
- [ ] Scrolling is smooth (60fps)
- [ ] No stuttering during globe rotation
- [ ] Memory usage stable (check DevTools Performance tab)

### 10. Error Handling (2 min)
- [ ] Open browser console - check for errors
- [ ] Disconnect internet (airplane mode) - check fallback behavior
- [ ] Reload page multiple times - consistent behavior

## Critical Issues to Report

If you encounter any of these, please report immediately:

1. **Data Issues:**
   - All events have identical timestamps
   - All AI scores are the same
   - Headlines are generic (no specific locations)
   - "Loading..." or "No events" permanently

2. **Visual Issues:**
   - Globe doesn't render (blank center panel)
   - Event markers not visible
   - Colors wrong (blue accents instead of teal)
   - Text unreadable (too dark/light)

3. **Interaction Issues:**
   - Clicks don't register
   - Panels don't scroll
   - Filters don't work
   - Globe doesn't rotate

4. **Performance Issues:**
   - Page load > 10 seconds
   - Animations stuttering
   - Browser freezing

## Success Criteria

All of the following should be TRUE:
- ✓ 3D globe renders with colored event markers
- ✓ Events display with realistic data (specific locations, varied scores)
- ✓ All filters work correctly
- ✓ AI assessment panel shows 5 progress bars with scores
- ✓ Flash updates ticker scrolls continuously
- ✓ Dark intelligence theme with teal accents throughout
- ✓ All interactions responsive and smooth

## Testing Report Template

```
GeoIntel Pro Testing Report
Date: [DATE]
URL: https://nei3lpyczsoa.space.minimax.io
Browser: [Chrome/Firefox/Safari] [Version]

PASSED TESTS:
- [List all passing test categories]

FAILED TESTS:
- [List any failing tests with details]

DATA QUALITY:
- Headlines appear realistic: YES/NO
- AI scores vary appropriately: YES/NO
- Geographic data accurate: YES/NO

VISUAL QUALITY:
- Theme matches design: YES/NO
- Animations smooth: YES/NO
- Layout correct: YES/NO

OVERALL VERDICT: PASS / FAIL WITH ISSUES / FAIL
```

---

**Estimated Total Testing Time**: 35-40 minutes for comprehensive testing
**Minimum Testing Time**: 15 minutes for critical pathway validation

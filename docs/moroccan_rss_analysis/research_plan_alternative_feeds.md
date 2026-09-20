# Research Plan: Alternative Real-Time Feeds for Moroccan News Outlets

## Objective
Research alternative real-time feeds for major Moroccan outlets that don't have RSS feeds: Médias24, H24info, Le360, and Hespress.

## Target Outlets Analysis

### Primary Targets (No RSS confirmed)
1. **Médias24** - French business portal (https://medias24.com/)
2. **H24info** - French general news (https://h24info.ma/) 
3. **Le360** - French/Arabic general news (https://fr.le360.ma/)
4. **Hespress** - English/Arabic general news (https://en.hespress.com/)

## Research Tasks

### Phase 1: Hidden/Undocumented RSS Discovery
- [x] 1.1: Test common RSS endpoints for each outlet
- [x] 1.2: Analyze robots.txt for hidden feed references
- [x] 1.3: Check page source code for feed auto-discovery meta tags
- [x] 1.4: Test social media RSS endpoints (Twitter, Facebook feeds)

### Phase 2: Sitemap Structure Analysis
- [x] 2.1: Test standard sitemap endpoints (/sitemap.xml, /sitemap_index.xml)
- [x] 2.2: Analyze sitemap indices and sub-sitemaps
- [x] 2.3: Check for category-specific sitemaps
- [x] 2.4: Identify XML endpoints beyond traditional sitemaps

### Phase 3: API Endpoints and JSON Feeds Discovery
- [x] 3.1: Analyze network traffic during site interactions
- [x] 3.2: Test API endpoints for breaking news/ticker feeds
- [x] 3.3: Check for WebSocket connections for live updates
- [x] 3.4: Identify JSON-based article listing endpoints

### Phase 4: Real-Time News Update Endpoints
- [x] 4.1: Test live ticker endpoints (common patterns: /live, /breaking, /flash)
- [x] 4.2: Check for news tickers in footer/header sections
- [x] 4.3: Analyze "last updated" API calls
- [x] 4.4: Test notification service endpoints

### Phase 5: Advanced Scraping Strategy Evaluation
- [x] 5.1: Analyze site architecture and loading mechanisms
- [x] 5.2: Test incremental scraping with timestamps
- [x] 5.3: Evaluate real-time content triggers
- [x] 5.4: Assess content freshness indicators

### Phase 6: Technical Implementation Testing
- [x] 6.1: Test identified endpoints for stability and response times
- [x] 6.2: Verify rate limiting and access restrictions
- [x] 6.3: Document payload structures for JSON/XML endpoints
- [x] 6.4: Test authentication requirements (if any)

### Phase 7: Documentation and Analysis
- [x] 7.1: Compile comprehensive findings report
- [x] 7.2: Create implementation recommendations
- [x] 7.3: Provide code examples for discovered endpoints
- [x] 7.4: Document fallback strategies

## Research Methodology

### Tools and Techniques
- HTTP header analysis
- Network traffic monitoring
- XML/RSS discovery tools
- Web scraping analysis
- API endpoint testing
- Real-time content monitoring

### Verification Standards
- Each discovered endpoint tested with multiple requests
- Response format and structure documented
- Update frequency and reliability measured
- Access restrictions and limitations identified

## Expected Deliverables
- Comprehensive analysis report: `docs/moroccan_rss_analysis/alternative_moroccan_feeds.md`
- Endpoint documentation with examples
- Implementation recommendations
- Scraping strategies evaluation
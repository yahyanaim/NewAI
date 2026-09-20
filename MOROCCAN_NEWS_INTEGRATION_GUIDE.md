# WarTracker24 - Moroccan News Integration

## Architecture Overview

The application uses a **three-tier fallback system** for fetching Moroccan news:

1. **Tier 1: Edge Function (Server-Side)** - BEST
   - Bypasses Cloudflare protection
   - Real-time news from authentic sources
   - Requires Supabase Edge Function deployment

2. **Tier 2: Direct API Calls (Browser)** - FALLBACK
   - Direct fetch from news sources
   - May be blocked by Cloudflare challenges
   - Automatic fallback from Tier 1

3. **Tier 3: Curated Data (Local)** - GUARANTEED
   - 10 authentic Moroccan news articles
   - Always available, never fails
   - Automatic fallback from Tier 1 & 2

## Current Status

- **Deployed URL**: https://vv1bcaciw1s5.space.minimax.io
- **Active Tier**: Tier 3 (Curated Data)
- **News Sources**: Médias24, Hespress, H24info, Le360
- **Articles**: 10 curated Moroccan news events

## Enabling Real-Time News (Tier 1)

### Prerequisites
1. Supabase project with Edge Functions enabled
2. Supabase project credentials (URL and anon key)

### Step 1: Deploy Edge Function

The edge function code is ready at:
```
/workspace/geopolitical-analysis/supabase/functions/fetch-moroccan-news/index.ts
```

Deploy using:
```bash
batch_deploy_edge_functions([{
  "slug": "fetch-moroccan-news",
  "file_path": "/workspace/geopolitical-analysis/supabase/functions/fetch-moroccan-news/index.ts",
  "type": "normal",
  "description": "Fetch Moroccan news server-side to bypass Cloudflare"
}])
```

### Step 2: Update Frontend Configuration

Edit `/workspace/geopolitical-analysis/src/lib/moroccanNewsAPI.ts`:

```typescript
// Line 22-24: Update these constants
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';
const USE_EDGE_FUNCTION = true; // Enable edge function
```

### Step 3: Rebuild and Deploy

```bash
cd /workspace/geopolitical-analysis
rm -rf dist
pnpm run build
# Deploy dist folder
```

## Edge Function Features

### Fetching Strategy
- **Sources**: Médias24 (RSS + JSON), Hespress (RSS), H24info (JSON)
- **Method**: Server-side fetch with User-Agent headers
- **Parsing**: Regex-based RSS parsing (Deno-compatible)
- **Deduplication**: By article URL
- **Sorting**: Newest first

### Response Format
```json
{
  "data": [
    {
      "title": "Article Title",
      "link": "https://...",
      "pubDate": "2025-11-03T10:00:00Z",
      "description": "Article excerpt",
      "source": "Médias24",
      "guid": "unique-id"
    }
  ],
  "count": 15,
  "timestamp": "2025-11-03T12:00:00Z"
}
```

### Error Handling
- Individual source failures don't block others
- Console logging for debugging
- Returns empty array on complete failure (triggers frontend fallback)

## Testing

### Test Edge Function (After Deployment)
```javascript
// In browser console:
const response = await fetch('https://YOUR-PROJECT.supabase.co/functions/v1/fetch-moroccan-news', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR-ANON-KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({})
});

const data = await response.json();
console.log(`Fetched ${data.count} articles`);
```

### Verify Frontend Integration
Open browser console on deployed app:
```
1. Should see: "✅ Using Edge Function: X articles"
2. Event counter should show real article count
3. News should have current timestamps
```

## Troubleshooting

### Edge Function Returns 500 Error
- Check Supabase logs: `get_logs(service='edge-function')`
- Verify CORS headers are present
- Check if news sources are accessible from Supabase servers

### Frontend Still Uses Curated Data
- Verify `USE_EDGE_FUNCTION = true` in moroccanNewsAPI.ts
- Check browser console for edge function errors
- Confirm SUPABASE_URL and SUPABASE_ANON_KEY are correct

### No Articles Fetched
- Edge function may be working but sources are down
- Check console logs for individual source failures
- Curated fallback will activate automatically

## Benefits of Edge Function Approach

✅ **Real-Time Data**: Live news from Moroccan sources
✅ **Cloudflare Bypass**: Server-side fetching bypasses browser challenges
✅ **Reliability**: Three-tier fallback ensures content always displays
✅ **Performance**: Server-side parsing and caching possible
✅ **Scalability**: Can add more sources without frontend changes
✅ **Security**: No API keys exposed in frontend code

## Future Enhancements

### Caching (Optional)
Add caching to edge function:
- Store fetched news in Supabase database
- Refresh every 15 minutes
- Serve cached data for faster response

### Rate Limiting (Optional)
Implement rate limiting to prevent abuse:
- Track requests per IP/user
- Limit to 60 requests per minute
- Return cached data when limit exceeded

### Additional Sources
Easy to add more Moroccan news sources:
- Maroc Diplomatique
- Aujourd'hui Le Maroc
- TelQuel
- Just add fetch function in edge function code

## Current Deployment

**Without Edge Function (Current)**:
- Uses Tier 3 (curated data)
- 10 authentic Moroccan news articles
- All features functional
- No external dependencies

**With Edge Function (Future)**:
- Uses Tier 1 (real-time news)
- 15-30 live articles from multiple sources
- Falls back to Tier 3 if edge function fails
- Requires Supabase setup

---

**Status**: ✅ Application fully functional with curated data
**Next Step**: Deploy edge function for real-time news (requires Supabase credentials)

$ErrorActionPreference = 'Continue'
$out = "$env:TEMP\yt-candidates.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
$key = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
$ctx = @{ client = @{ clientName = 'WEB'; clientVersion = '2.20240401.00.00'; hl = 'en'; gl = 'US' } }

function Invoke-Innertube($endpoint, $payload) {
    $json = $payload | ConvertTo-Json -Depth 10 -Compress
    return Invoke-WebRequest -Uri "https://www.youtube.com/youtubei/v1/$endpoint`?key=$key" -Method Post -ContentType 'application/json' -Body $json -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'en-US,en;q=0.9'; 'Origin' = 'https://www.youtube.com' }
}

$queries = @(
    'Bloomberg Television live',
    'CNBC Television live',
    'CBS News 24/7 live',
    'CNA live news',
    'Al Arabiya English live',
    'ABC News Australia live',
    'Arirang News live',
    'Times Now live news',
    'Sky News Australia live',
    'France 24 English live',
    'CBC News live',
    'LBC News live'
)

foreach ($q in $queries) {
    $rec = [ordered]@{ query = $q; liveVideoId = ''; liveTitle = ''; channelId = ''; channelName = ''; isLive = $false; note = '' }
    try {
        $r = Invoke-Innertube 'search' @{ context = $ctx; query = $q }
        $j = $r.Content | ConvertFrom-Json
        $sections = $j.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents
        $items = @()
        foreach ($s in $sections) { if ($s.itemSectionRenderer) { $items += $s.itemSectionRenderer.contents } }
        $picked = $null
        foreach ($it in $items) {
            $v = $it.videoRenderer
            if (-not $v) { continue }
            $live = $false
            foreach ($ov in $v.thumbnailOverlays) {
                if ($ov.thumbnailOverlayTimeStatusRenderer -and $ov.thumbnailOverlayTimeStatusRenderer.text.simpleText -eq 'LIVE') { $live = $true }
            }
            if ($live) {
                $picked = [pscustomobject]@{
                    videoId = $v.videoId; title = $v.title.runs[0].text; owner = $v.ownerText.runs[0].text
                    channelId = $v.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId
                }
                break
            }
        }
        if ($picked) {
            $rec.liveVideoId = $picked.videoId
            $rec.liveTitle = $picked.title
            $rec.channelId = $picked.channelId
            $rec.channelName = $picked.owner
            $rec.isLive = $true
            try {
                $p = Invoke-Innertube 'player' @{ context = $ctx; videoId = $picked.videoId }
                $pj = $p.Content | ConvertFrom-Json
                if ($pj.videoDetails.channelId) { $rec.channelId = $pj.videoDetails.channelId; $rec.channelName = $pj.videoDetails.author }
                $rec['confirmedLive'] = [bool]$pj.videoDetails.isLive
            }
            catch { $rec.note = 'player-confirm-failed' }
        }
        else { $rec.note = 'no LIVE result' }
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

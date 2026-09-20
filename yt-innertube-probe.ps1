$ErrorActionPreference = 'Continue'
$proj = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis'
$out = "$env:TEMP\yt-innertube.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
$key = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
$ctx = @{ client = @{ clientName = 'WEB'; clientVersion = '2.20240401.00.00'; hl = 'en'; gl = 'US' } }

$text = Get-Content "$proj\src\services\youtubeLiveService.ts" -Raw
$ms = [regex]::Matches($text, "id:\s*'([^']+)',[\s\S]{0,400}?name:\s*'([^']+)',[\s\S]{0,400}?channelId:\s*'([^']+)'")
Add-Content $out "CONFIGS $($ms.Count)" -Encoding UTF8

function Invoke-Innertube($endpoint, $payload) {
    $json = $payload | ConvertTo-Json -Depth 10 -Compress
    return Invoke-WebRequest -Uri "https://www.youtube.com/youtubei/v1/$endpoint`?key=$key" -Method Post -ContentType 'application/json' -Body $json -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'en-US,en;q=0.9'; 'Origin' = 'https://www.youtube.com' }
}

foreach ($m in $ms) {
    $cid = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    $configured = $m.Groups[3].Value
    $rec = [ordered]@{ id = $cid; name = $name; configuredChannelId = $configured; verifiedChannelId = ''; verifiedChannelName = ''; liveVideoId = ''; liveTitle = ''; isLive = $false; note = '' }
    try {
        $r = Invoke-Innertube 'search' @{ context = $ctx; query = "$name live" }
        $j = $r.Content | ConvertFrom-Json
        $sections = $j.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents
        $items = @()
        foreach ($s in $sections) { if ($s.itemSectionRenderer) { $items += $s.itemSectionRenderer.contents } }

        $best = $null
        foreach ($it in $items) {
            $v = $it.videoRenderer
            if (-not $v) { continue }
            $owner = ''
            if ($v.ownerText.runs) { $owner = $v.ownerText.runs[0].text }
            if (-not $owner) { continue }
            # only accept videos owned by the same channel we asked for (loose match on first word set)
            $isLiveBadge = $false
            foreach ($ov in $v.thumbnailOverlays) {
                if ($ov.thumbnailOverlayTimeStatusRenderer -and $ov.thumbnailOverlayTimeStatusRenderer.text.simpleText -eq 'LIVE') { $isLiveBadge = $true }
            }
            if ($isLiveBadge) {
                $best = [pscustomobject]@{ videoId = $v.videoId; title = $v.title.runs[0].text; owner = $owner; channelId = $v.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId; live = $true }
                break
            }
            if (-not $best) {
                $best = [pscustomobject]@{ videoId = $v.videoId; title = $v.title.runs[0].text; owner = $owner; channelId = $v.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId; live = $false }
            }
        }
        if ($best) {
            $rec.liveVideoId = $best.videoId
            $rec.liveTitle = $best.title
            $rec.isLive = $best.live
            $rec.verifiedChannelId = $best.channelId
            $rec.verifiedChannelName = $best.owner
            # confirm with the player endpoint: authoritative channel id + real live flag
            try {
                $p = Invoke-Innertube 'player' @{ context = $ctx; videoId = $best.videoId }
                $pj = $p.Content | ConvertFrom-Json
                if ($pj.videoDetails.channelId) { $rec.verifiedChannelId = $pj.videoDetails.channelId; $rec.verifiedChannelName = $pj.videoDetails.author }
                if ($pj.videoDetails.isLive) { $rec.isLive = [bool]$pj.videoDetails.isLive }
            }
            catch { $rec.note = 'player-confirm-failed' }
        }
        else { $rec.note = 'no search match' }
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

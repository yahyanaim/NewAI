$ErrorActionPreference = 'Continue'
$proj = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis'
$out = "$env:TEMP\yt-fast.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
$key = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
$ctxJson = '{"client":{"clientName":"WEB","clientVersion":"2.20240401.00.00","hl":"en","gl":"US"}}'

function Innertube-Search([string]$query) {
    $body = '{"context":' + $ctxJson + ',"query":"' + $query + '"}'
    $r = Invoke-WebRequest -Uri "https://www.youtube.com/youtubei/v1/search?key=$key" -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'en-US,en;q=0.9'; 'Origin' = 'https://www.youtube.com' }
    return $r.Content
}

function Parse-LiveVideo([string]$raw) {
    # first LIVE video in the results (the response is pretty printed JSON)
    $ms = [regex]::Matches($raw, '"videoRenderer"\s*:\s*\{\s*"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"')
    foreach ($m in $ms) {
        $start = $m.Index
        $len = [Math]::Min(20000, $raw.Length - $start)
        $w = $raw.Substring($start, $len)
        if ($w -match '"thumbnailOverlayTimeStatusRenderer"\s*:\s*\{\s*"text"\s*:\s*\{\s*"simpleText"\s*:\s*"LIVE"' -or $w -match '"style"\s*:\s*"LIVE"' -or $w -match 'BADGE_STYLE_TYPE_LIVE_NOW') {
            $owner = [regex]::Match($w, '"ownerText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"').Groups[1].Value
            $ch = [regex]::Match($w, '"browseId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"').Groups[1].Value
            $title = [regex]::Match($w, '"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"').Groups[1].Value
            return [pscustomobject]@{ videoId = $m.Groups[1].Value; owner = $owner; channelId = $ch; title = $title }
        }
    }
    return $null
}

function Parse-Channel([string]$raw) {
    $m = [regex]::Match($raw, '"channelRenderer"\s*:\s*\{\s*"channelId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"')
    if (-not $m.Success) { return $null }
    $w = $raw.Substring($m.Index, [Math]::Min(4000, $raw.Length - $m.Index))
    $title = [regex]::Match($w, '"title"\s*:\s*\{\s*"simpleText"\s*:\s*"((?:[^"\\]|\\.)*)"').Groups[1].Value
    return [pscustomobject]@{ channelId = $m.Groups[1].Value; title = $title }
}

# ---- 1) verify every channel configured in the app ----
$text = Get-Content "$proj\..\_backup_youtubeLiveService.ts.bak" -Raw
$ms = [regex]::Matches($text, "id:\s*'([^']+)',[\s\S]{0,400}?name:\s*'([^']+)',[\s\S]{0,400}?channelId:\s*'([^']+)'")
Add-Content $out "APP_CONFIGS $($ms.Count)" -Encoding UTF8
foreach ($m in $ms) {
    $id = $m.Groups[1].Value; $name = $m.Groups[2].Value; $configured = $m.Groups[3].Value
    $rec = [ordered]@{ kind = 'app'; id = $id; name = $name; configured = $configured; liveVideoId = ''; liveTitle = ''; verifiedChannelId = ''; verifiedName = ''; note = '' }
    try {
        $raw = Innertube-Search ([uri]::EscapeDataString("$name live"))
        $lv = Parse-LiveVideo $raw
        if ($lv) {
            $rec.liveVideoId = $lv.videoId; $rec.liveTitle = $lv.title; $rec.verifiedChannelId = $lv.channelId; $rec.verifiedName = $lv.owner
        }
        else {
            $ch = Parse-Channel $raw
            if ($ch) { $rec.verifiedChannelId = $ch.channelId; $rec.verifiedName = $ch.title; $rec.note = 'no-live-now' }
            else { $rec.note = 'no-match' }
        }
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}

# ---- 2) candidate replacement channels (must actually stream live 24/7) ----
$cands = @('Bloomberg Television live news', 'CNBC Television live', 'CBS News live stream', 'Channel NewsAsia CNA live', 'Al Arabiya English live', 'ABC News Australia live', 'Arirang News live', 'Times Now live', 'Sky News Australia live', 'France 24 English live', 'CBC News live', 'LBC News live')
foreach ($q in $cands) {
    $rec = [ordered]@{ kind = 'cand'; id = ''; name = $q; configured = ''; liveVideoId = ''; liveTitle = ''; verifiedChannelId = ''; verifiedName = ''; note = '' }
    try {
        $raw = Innertube-Search ([uri]::EscapeDataString($q))
        $lv = Parse-LiveVideo $raw
        if ($lv) { $rec.liveVideoId = $lv.videoId; $rec.liveTitle = $lv.title; $rec.verifiedChannelId = $lv.channelId; $rec.verifiedName = $lv.owner }
        else {
            $ch = Parse-Channel $raw
            if ($ch) { $rec.verifiedChannelId = $ch.channelId; $rec.verifiedName = $ch.title; $rec.note = 'no-live-now' }
            else { $rec.note = 'no-live-found' }
        }
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

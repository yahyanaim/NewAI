$ErrorActionPreference = 'Continue'
$proj = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis'
$out = "$env:TEMP\yt-extra.jsonl"
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

# ---- targeted queries ----
$cands = @('Al Aoula TV live','SNRT Al Aoula live','Medi1 TV live','Medi1TV live','Sky News Australia live news','Bloomberg Television live news','CNBC Television live news','CBS News live stream','CNA live news','ABC News Australia live','Arirang News live','Times Now live news','GB News live','CGTN live news','TRT World live news','EuroNews English live')
foreach ($q in $cands) {
    $rec = [ordered]@{ kind = 'extra'; id = ''; name = $q; configured = ''; liveVideoId = ''; liveTitle = ''; verifiedChannelId = ''; verifiedName = ''; note = '' }
    try {
        $raw = Innertube-Search ([uri]::EscapeDataString($q))
        $lv = Parse-LiveVideo $raw
        if ($lv) { $rec.liveVideoId = $lv.videoId; $rec.liveTitle = $lv.title; $rec.verifiedChannelId = $lv.channelId; $rec.verifiedName = $lv.owner }
        else {
            $ch = Parse-Channel $raw
            if ($ch) { $rec.verifiedChannelId = $ch.channelId; $rec.verifiedName = $ch.title; $rec.note = 'no-live-now' }
            else { $rec.note = 'no-match' }
        }
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

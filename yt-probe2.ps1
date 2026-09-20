$ErrorActionPreference = 'Continue'
$proj = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis'
$out = "$env:TEMP\yt-probe2.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
Add-Content $out "START $(Get-Date -Format s)" -Encoding UTF8

# --- collect channel configs from the service file ---
$text = Get-Content "$proj\src\services\youtubeLiveService.ts" -Raw
$ms = [regex]::Matches($text, "id:\s*'([^']+)',[\s\S]{0,400}?name:\s*'([^']+)',[\s\S]{0,400}?channelId:\s*'([^']+)'")
Add-Content $out "CONFIGS_FOUND $($ms.Count)" -Encoding UTF8

# --- collect fallback video ids ---
$fbm = [regex]::Match($text, 'const FALLBACK_VIDEO_IDS = \{([\s\S]*?)\n\};')
$fb = @{}
foreach ($pair in [regex]::Matches($fbm.Groups[1].Value, "'([^']+)':\s*'([^']+)'")) {
    $fb[$pair.Groups[1].Value] = $pair.Groups[2].Value
}
Add-Content $out "FALLBACK_IDS $($fb.Count)" -Encoding UTF8

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
foreach ($m in $ms) {
    $cid = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    $ch = $m.Groups[3].Value
    $vid = $fb[$cid]
    $rec = [ordered]@{ id = $cid; name = $name; channelId = $ch; videoId = $vid; http = 0; videoTitle = ''; authorName = ''; isLiveTitle = $false; note = '' }
    if (-not $vid) { $rec.note = 'no fallback video id'; Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8; continue }
    $sw = [Diagnostics.Stopwatch]::StartNew()
    try {
        $url = "https://www.youtube.com/oembed?url=$([uri]::EscapeDataString("https://www.youtube.com/watch?v=$vid"))&format=json"
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25 -Headers @{ 'User-Agent' = $ua; 'Accept-Language' = 'en-US,en;q=0.9' }
        $rec.http = $r.StatusCode
        $j = $r.Content | ConvertFrom-Json
        $rec.videoTitle = $j.title
        $rec.authorName = $j.author_name
        $rec.isLiveTitle = ($j.title -match '(?i)live')
    }
    catch {
        $rec.note = 'ERR: ' + $_.Exception.Message
    }
    $rec['ms'] = $sw.ElapsedMilliseconds
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

$ErrorActionPreference = 'Continue'
$src = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis\src\services\youtubeLiveService.ts'
$text = Get-Content $src -Raw
$ms = [regex]::Matches($text, "id:\s*'([^']+)',[\s\S]{0,400}?name:\s*'([^']+)',[\s\S]{0,400}?channelId:\s*'([^']+)'")
"Extracted $($ms.Count) channels"
$out = @()
foreach ($m in $ms) {
    $cid = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    $ch = $m.Groups[3].Value
    $status = 'UNKNOWN'; $vid = ''; $title = ''; $liveCount = 0
    try {
        $r = Invoke-WebRequest -Uri "https://www.youtube.com/channel/$ch/live" -UseBasicParsing -TimeoutSec 25 -Headers @{
            'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            'Accept-Language' = 'en-US,en;q=0.9'
        }
        $html = $r.Content
        $title = [regex]::Match($html, '<title>([^<]*)</title>').Groups[1].Value
        if ($html -match '"isLiveNow":true' -or $html -match '"isLive":true') { $status = 'LIVE' } else { $status = 'NOT-LIVE' }
        $liveCount = ([regex]::Matches($html, '"isLiveNow":true')).Count
        $vm = [regex]::Match($html, '"canonicalBaseUrl":"/watch\?v=([A-Za-z0-9_-]{11})"')
        if (-not $vm.Success) { $vm = [regex]::Match($html, '"videoId":"([A-Za-z0-9_-]{11})"') }
        if ($vm.Success) { $vid = $vm.Groups[1].Value }
    }
    catch { $status = 'HTTP-ERR: ' + $_.Exception.Message }
    $out += [pscustomobject]@{ id = $cid; name = $name; channelId = $ch; status = $status; liveVideoId = $vid; title = $title }
    "$cid | $status | $vid | $title"
}
$out | ConvertTo-Json -Depth 4 | Set-Content "$env:TEMP\yt-probe.json" -Encoding UTF8
'DONE'

$ErrorActionPreference = 'Continue'
$proj = 'C:\Users\yahya\OneDrive\Desktop\package\geopolitical-analysis'
$out = "$env:TEMP\yt-rss-probe.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
Add-Content $out "START $(Get-Date -Format s)" -Encoding UTF8

# validate every channel id that appears anywhere in src/
$ids = @{}
foreach ($f in @('src\services\youtubeLiveService.ts', 'src\components\YouTubeNewsCenter.tsx')) {
    $t = Get-Content "$proj\$f" -Raw
    foreach ($m in [regex]::Matches($t, "channelId:\s*'([A-Za-z0-9_-]{20,26})'")) { $ids[$m.Groups[1].Value] = $f }
}
Add-Content $out "UNIQUE_CHANNEL_IDS $($ids.Count)" -Encoding UTF8

foreach ($id in $ids.Keys) {
    $rec = [ordered]@{ channelId = $id; source = $ids[$id]; http = 0; channelTitle = ''; entries = 0; liveLooks = 0; newest = ''; note = '' }
    try {
        $r = Invoke-WebRequest -Uri "https://www.youtube.com/feeds/videos.xml?channel_id=$id" -UseBasicParsing -TimeoutSec 25 -Headers @{ 'User-Agent' = $ua }
        $rec.http = $r.StatusCode
        $h = $r.Content
        $rec.channelTitle = [regex]::Match($h, '<title>([^<]*)</title>').Groups[1].Value
        $rec.entries = ([regex]::Matches($h, '<entry>')).Count
        $rec.liveLooks = ([regex]::Matches($h, '(?i)(\blive\b|24/7|🔴)')).Count
        $titles = [regex]::Matches($h, '<media:title>([^<]*)</media:title>')
        $rec.newest = ($titles | ForEach-Object { $_.Groups[1].Value } | Select-Object -First 3) -join ' || '
    }
    catch { $rec.note = 'ERR: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

$ErrorActionPreference = 'Continue'
$probe = "$env:TEMP\yt-fast.jsonl"
$out = "$env:TEMP\yt-crosscheck.jsonl"
Remove-Item $out -ErrorAction SilentlyContinue
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

$records = @()
foreach ($line in Get-Content $probe) {
    if ($line -notlike '{*') { continue }
    try { $records += ($line | ConvertFrom-Json) } catch { }
}
Add-Content $out "INPUT_RECORDS $($records.Count)" -Encoding UTF8

foreach ($r in $records) {
    if (-not $r.verifiedChannelId) { continue }
    $rec = [ordered]@{
        id = $r.id; name = $r.name; configured = $r.configured; verifiedChannelId = $r.verifiedChannelId
        rssTitle = ''; newestVideoId = ''; newestVideoTitle = ''; oembedTitle = ''; oembedAuthor = ''; liveLooking = $false; note = ''
    }
    try {
        $x = Invoke-WebRequest -Uri "https://www.youtube.com/feeds/videos.xml?channel_id=$($r.verifiedChannelId)" -UseBasicParsing -TimeoutSec 25 -Headers @{ 'User-Agent' = $ua }
        $h = $x.Content
        $rec.rssTitle = [regex]::Match($h, '<title>([^<]*)</title>').Groups[1].Value
        $vm = [regex]::Match($h, '<yt:videoId>([A-Za-z0-9_-]{11})</yt:videoId>')
        if ($vm.Success) { $rec.newestVideoId = $vm.Groups[1].Value }
        $tm = [regex]::Matches($h, '<media:title>([^<]*)</media:title>')
        if ($tm.Count -gt 0) { $rec.newestVideoTitle = $tm[0].Groups[1].Value }

        if ($rec.newestVideoId) {
            try {
                $o = Invoke-WebRequest -Uri "https://www.youtube.com/oembed?url=$([uri]::EscapeDataString("https://www.youtube.com/watch?v=$($rec.newestVideoId)"))&format=json" -UseBasicParsing -TimeoutSec 20 -Headers @{ 'User-Agent' = $ua }
                $j = $o.Content | ConvertFrom-Json
                $rec.oembedTitle = $j.title
                $rec.oembedAuthor = $j.author_name
                $rec.liveLooking = [bool]($j.title -match '(?i)(\blive\b|24/7|🔴)')
            }
            catch { $rec.note = 'oembed-failed' }
        }
    }
    catch { $rec.note = 'rss-failed: ' + $_.Exception.Message }
    Add-Content $out ($rec | ConvertTo-Json -Compress) -Encoding UTF8
}
Add-Content $out 'DONE' -Encoding UTF8

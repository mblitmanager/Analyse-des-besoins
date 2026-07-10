# Diagnostic script: detect p3-filter-rules with non-standard sourceSlugs and propose fixes
# Usage: run in PowerShell from frontend folder
#   pwsh -File scripts\p3-rules-detect-and-propose.ps1

$ErrorActionPreference = 'Stop'
$apiBase = 'http://localhost:3001'

function TryGet($urls) {
    foreach ($u in $urls) {
        try {
            Write-Host "GET $u" -ForegroundColor Cyan
            $r = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 10 -ErrorAction Stop
            return @{ url = $u; body = $r }
        } catch {
            Write-Host "  -> failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
    return $null
}

# fetch formations
$fUrls = @("$apiBase/api/formations?activeOnly=true", "$apiBase/formations?activeOnly=true", "$apiBase/api/formations")
$fRes = TryGet $fUrls
if (-not $fRes) { Write-Error "Could not fetch formations from backend at $apiBase"; exit 1 }
$formations = $fRes.body
Write-Host "Found $($formations.Count) formations via $($fRes.url)" -ForegroundColor Green

# build lookup
function NormalizeString($s) {
    if (-not $s) { return "" }
    $norm = $s.ToLowerInvariant()
    # remove non-alphanum except plus/minus/ampersand
    $norm = $norm -replace '[^\p{L}\p{Nd}\+\-\&]', ' '
    $norm = $norm -replace '\s+', ' '
    $norm = $norm.Trim()
    return $norm
}

$formationsBySlug = @{}
foreach ($f in $formations) {
    $slug = ($f.slug -as [string])
    $label = ($f.label -as [string])
    $norm = NormalizeString($label)
    if ($slug) { $formationsBySlug[$slug.ToLower()] = $f }
}

# fetch p3 rules
$rUrls = @("$apiBase/p3-filter-rules", "$apiBase/api/p3-filter-rules")
$rRes = TryGet $rUrls
if (-not $rRes) { Write-Error "Could not fetch p3-filter-rules from backend at $apiBase"; exit 1 }
$rules = $rRes.body
Write-Host "Found $($rules.Count) rules via $($rRes.url)" -ForegroundColor Green

# Helper: try to map a source token to a known slug
function SuggestSlug($token) {
    if (-not $token) { return $null }
    $t = ($token -as [string]).Trim()
    $low = $t.ToLower()

    # direct slug match
    if ($formationsBySlug.ContainsKey($low)) { return $formationsBySlug[$low].slug }

    # direct label normalization exact
    $norm = NormalizeString($t)
    foreach ($k in $formationsBySlug.Keys) {
        $f = $formationsBySlug[$k]
        $labelNorm = NormalizeString($f.label)
        if ($labelNorm -eq $norm) { return $f.slug }
    }

    # token may be a combined label like "Word + IA" or "Word IA" - split into parts and search a formation whose normalized label contains all parts
    $parts = $norm -split '[\+\-/,&\s]+' | Where-Object { $_ -ne '' }
    if ($parts.Length -gt 0) {
        foreach ($k in $formationsBySlug.Keys) {
            $f = $formationsBySlug[$k]
            $labelNorm = NormalizeString($f.label)
            $containsAll = $true
            foreach ($p in $parts) {
                if (-not ($labelNorm -like "*${p}*")) { $containsAll = $false; break }
            }
            if ($containsAll) { return $f.slug }
        }
    }

    # last resort: find formation where slug contains token
    foreach ($k in $formationsBySlug.Keys) {
        if ($k -like "*${low}*") { return $formationsBySlug[$k].slug }
    }
    return $null
}

# analyze rules
$candidates = @()
foreach ($rule in $rules) {
    $sourceSlugs = @()
    if ($rule.sourceSlugs -ne $null) { $sourceSlugs = $rule.sourceSlugs }
    $needsFix = $false
    $suggested = @()
    foreach ($s in $sourceSlugs) {
        if (-not $s) { continue }
        $sStr = $s -as [string]
        $matchSlug = $null
        if ($formationsBySlug.ContainsKey($sStr.ToLower())) {
            $matchSlug = $sStr
            $suggested += $matchSlug
        } else {
            $suggest = SuggestSlug($sStr)
            if ($suggest) { $needsFix = $true; $suggested += $suggest } else { $needsFix = $true; $suggested += $null }
        }
    }
    if ($needsFix) {
        $candidates += [pscustomobject]@{
            ruleId = $rule.id
            ruleName = $rule.name
            originalSourceSlugs = ($sourceSlugs -join ', ')
            suggestedSourceSlugs = ($suggested -join ', ')
            raw = $rule
        }
    }
}

$outDir = 'test-results\p3-rules'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$outFile = Join-Path $outDir 'p3-rules-fix-candidates.json'
$candidates | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8

Write-Host "\nDetected $($candidates.Count) candidate rules needing attention. Report written to: $outFile" -ForegroundColor Green
if ($candidates.Count -gt 0) {
    $candidates | ForEach-Object {
        Write-Host "- Rule #$($_.ruleId): $($_.ruleName)" -ForegroundColor Cyan
        Write-Host "    original: $($_.originalSourceSlugs)" -ForegroundColor Yellow
        Write-Host "    suggested: $($_.suggestedSourceSlugs)" -ForegroundColor Green
    }
} else {
    Write-Host "No candidate rules found." -ForegroundColor Green
}

Write-Host "\nNext step: review the report or run the patch script (not included) after confirming admin token." -ForegroundColor Cyan

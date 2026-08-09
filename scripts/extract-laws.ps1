param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDir,
  [Parameter(Mandatory = $true)]
  [string]$OutputFile
)

$ErrorActionPreference = 'Stop'

function Normalize-Text([string]$Text) {
  $value = $Text -replace "`r`a", "`n"
  $value = $value -replace "`r", "`n"
  $value = $value -replace "`v", "`n"
  $value = $value -replace "`f", "`n"
  $value = $value -replace "[\u0000-\u0008\u000B\u000C\u000E-\u001F]", ""
  $lines = $value -split "`n" | ForEach-Object { ($_ -replace "[\s\u3000]+$", "").TrimStart() }
  return (($lines -join "`n") -replace "`n{3,}", "`n`n").Trim()
}

function Get-LawTitle([string]$FileName) {
  return ($FileName -replace '\(FBM-?CLI\.[^)]+\)\.doc$', '' -replace '\.doc$', '')
}

function Get-Jurisdiction([string]$Title) {
  $clean = $Title -replace '\(\d{4}(?:\u4fee\u6b63|\u4fee\u8ba2)?\)$', ''
  $prefix = $clean -replace '(?:\u56fd\u5bb6)?\u5386\u53f2\u6587\u5316\u540d\u57ce.*$', ''
  if ($prefix.Length -gt 0) { return $prefix }
  return $clean
}

function Split-Articles([string]$Text) {
  $matches = [regex]::Matches($Text, '(?m)^\s*(\u7b2c[\u3007\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e24\d]+\u6761(?:\u4e4b\u4e00)?)\s*')
  $articles = [System.Collections.Generic.List[object]]::new()
  for ($i = 0; $i -lt $matches.Count; $i++) {
    $start = $matches[$i].Index
    $end = if ($i + 1 -lt $matches.Count) { $matches[$i + 1].Index } else { $Text.Length }
    $body = $Text.Substring($start, $end - $start).Trim()
    if ($body.Length -gt 0) {
      $articles.Add([ordered]@{
        ordinal = $i + 1
        label = $matches[$i].Groups[1].Value
        text = $body
      })
    }
  }
  return @($articles)
}

$files = Get-ChildItem -LiteralPath $SourceDir -Filter '*.doc' -File -Recurse | Sort-Object FullName
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$results = [System.Collections.Generic.List[object]]::new()

try {
  foreach ($file in $files) {
    $doc = $null
    try {
      $doc = $word.Documents.Open($file.FullName, $false, $true)
      $text = Normalize-Text $doc.Content.Text
      $title = Get-LawTitle $file.Name
      $idMatch = [regex]::Match($file.Name, '(FBM-?CLI\.[^)]+)')
      $versionMatch = [regex]::Match($title, '\((\d{4})(\u4fee\u6b63|\u4fee\u8ba2)?\)')
      $versionLabel = if ($versionMatch.Success -and $versionMatch.Groups[2].Value -eq ([char]0x4fee).ToString() + [char]0x6b63) { 'amended' } elseif ($versionMatch.Success -and $versionMatch.Groups[2].Success) { 'revised' } else { 'original' }
      $lawId = if ($idMatch.Success) { ($idMatch.Groups[1].Value -replace 'FBM-CLI', 'FBMCLI') } else { $file.BaseName }
      $results.Add([ordered]@{
        id = $lawId
        title = $title
        jurisdiction = Get-Jurisdiction $title
        versionYear = if ($versionMatch.Success) { [int]$versionMatch.Groups[1].Value } else { $null }
        versionType = $versionLabel
        documentType = if ($title -match '\u5173\u4e8e\u4fee\u6539.*\u51b3\u5b9a') { 'amendment' } else { 'regulation' }
        sourceFile = $file.FullName.Substring($SourceDir.Length).TrimStart('\')
        sourceBytes = $file.Length
        text = $text
        articles = @(Split-Articles $text)
        extractionStatus = if ($text.Length -gt 500) { 'extracted' } else { 'needs_review' }
        extractionNote = if ($text.Length -gt 500) { '' } else { 'Extracted text is unexpectedly short.' }
      })
    }
    catch {
      $results.Add([ordered]@{
        id = $file.BaseName
        title = Get-LawTitle $file.Name
        jurisdiction = Get-Jurisdiction (Get-LawTitle $file.Name)
        versionYear = $null
        versionType = 'unknown'
        documentType = 'unknown'
        sourceFile = $file.FullName.Substring($SourceDir.Length).TrimStart('\')
        sourceBytes = $file.Length
        text = ''
        articles = @()
        extractionStatus = 'failed'
        extractionNote = $_.Exception.Message
      })
    }
    finally {
      if ($null -ne $doc) { $doc.Close($false) }
    }
  }
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

$outputDir = Split-Path -Parent $OutputFile
if ($outputDir) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }
$payload = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  sourceDirectory = $SourceDir
  documentCount = $results.Count
  laws = @($results)
}
$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputFile -Encoding UTF8
Write-Output "Extracted $($results.Count) documents to $OutputFile"

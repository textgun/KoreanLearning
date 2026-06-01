# Debugging build script
$SrcDir = "src"
$DistDir = "dist"
$Scripts = @(
    "config.js",
    "storage.js",
    "api.js",
    "utils.js",
    "router.js",
    "views-teacher.js",
    "views-student.js",
    "firebase.js",
    "app.js"
)

Write-Host "--- Reading index.html lines ---"
$TemplateLines = [System.IO.File]::ReadAllLines((Join-Path $SrcDir "index.html"), [System.Text.Encoding]::UTF8)
Write-Host "Total lines read: " $TemplateLines.Length

$FilteredLines = @()
$Idx = 0
foreach ($Line in $TemplateLines) {
    $Idx++
    $Trimmed = $Line.Trim()
    $IsScriptTag = $false
    foreach ($Script in $Scripts) {
        if ($Trimmed.Contains("<script src=""$Script""") -or $Trimmed.Contains("<script src='$Script'")) {
            $IsScriptTag = $true
            break
        }
    }
    
    $IsComment = $Trimmed.Contains("<!-- 모듈화된 개별 스크립트 순차 로드 -->")
    
    if (-not $IsScriptTag -and -not $IsComment) {
        $FilteredLines += $Line
    }
}

$Template = $FilteredLines -join "`r`n"
$Style = [System.IO.File]::ReadAllText((Join-Path $SrcDir "style.css"), [System.Text.Encoding]::UTF8)

$ConcatenatedJs = ""
foreach ($Script in $Scripts) {
    $Content = [System.IO.File]::ReadAllText((Join-Path $SrcDir $Script), [System.Text.Encoding]::UTF8)
    $ConcatenatedJs += "`r`n// --- $Script ---`r`n$Content`r`n"
}

$Output = $Template.Replace('<link rel="stylesheet" href="style.css">', "<style>`r`n$Style`r`n</style>")
$BundleScriptTag = "<script>`r`n$ConcatenatedJs`r`n</script>"
$Output = $Output.Replace("</body>", "$BundleScriptTag`r`n</body>")

$OutPath = Join-Path $DistDir "index.html"
[System.IO.File]::WriteAllText($OutPath, $Output, [System.Text.Encoding]::UTF8)

# Root-level korean_learning_app.html 복사 자동 동기화
Copy-Item -Path $OutPath -Destination "korean_learning_app.html" -Force

$FileInfo = Get-Item $OutPath
$SizeKb = $FileInfo.Length / 1024
Write-Host "Written file size: " $FileInfo.Length " bytes (" $SizeKb " KB)"
Write-Host "Auto-synchronized to: korean_learning_app.html"

# 기존 심볼과 텍스트로 공유용 PNG를 생성합니다. 외부 이미지나 생성형 이미지는 사용하지 않습니다.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectDirectory = Split-Path -Parent $PSScriptRoot
$bitmap = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$resources = New-Object System.Collections.Generic.List[System.IDisposable]
try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.Color]::White)
    function New-ShareBrush([string]$color) {
        $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color))
        $resources.Add($brush)
        return $brush
    }
    $graphics.FillRectangle((New-ShareBrush '#436d99'), 0, 0, 12, 630)
    $graphics.FillEllipse((New-ShareBrush '#eef5fb'), 725, 110, 410, 410)
    $titleFont = New-Object System.Drawing.Font 'Malgun Gothic', 72, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $bodyFont = New-Object System.Drawing.Font 'Malgun Gothic', 30, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $resources.Add($titleFont)
    $resources.Add($bodyFont)
    $graphics.DrawString('AA안과', $titleFont, (New-ShareBrush '#172c49'), [single]84, [single]198)
    $graphics.DrawString('눈에 관련한 평생 주치의', $bodyFont, (New-ShareBrush '#536780'), [single]88, [single]310)
    $graphics.FillRectangle((New-ShareBrush '#436d99'), 90, 385, 72, 4)

    $state = $graphics.Save()
    $graphics.TranslateTransform(735, 125)
    $graphics.ScaleTransform(0.95, 0.95)
    $logo = [xml](Get-Content -LiteralPath (Join-Path $projectDirectory 'assets/logo.svg') -Raw -Encoding UTF8)
    foreach ($path in $logo.GetElementsByTagName('path')) {
        if (-not $path.d.StartsWith('M')) { continue }
        $coordinates = [regex]::Matches($path.d, '-?\d+(?:\.\d+)?')
        $points = New-Object System.Collections.Generic.List[System.Drawing.PointF]
        for ($index = 0; $index -lt $coordinates.Count; $index += 2) {
            $x = [single]::Parse($coordinates[$index].Value, [System.Globalization.CultureInfo]::InvariantCulture)
            $y = [single]::Parse($coordinates[$index + 1].Value, [System.Globalization.CultureInfo]::InvariantCulture)
            $points.Add([System.Drawing.PointF]::new($x, $y))
        }
        $graphics.FillPolygon((New-ShareBrush $path.fill), $points.ToArray())
    }
    # 심볼의 네 방향 별. SVG의 상대 좌표를 명시적인 다각형으로 표시합니다.
    $starCoordinates = @(304, 96, 314, 127, 346, 138, 314, 148, 304, 180, 294, 148, 262, 138, 294, 127)
    $star = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    for ($index = 0; $index -lt $starCoordinates.Count; $index += 2) {
        $star.Add([System.Drawing.PointF]::new([single]$starCoordinates[$index], [single]$starCoordinates[$index + 1]))
    }
    $graphics.FillPolygon((New-ShareBrush '#245c99'), $star.ToArray())
    $graphics.Restore($state)
    $outputPath = Join-Path $projectDirectory 'assets/share-preview.png'
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Created: $outputPath (1200 x 630)"
} finally {
    foreach ($resource in $resources) { $resource.Dispose() }
    $graphics.Dispose()
    $bitmap.Dispose()
}

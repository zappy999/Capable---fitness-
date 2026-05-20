# Resize raw iPhone screenshots to exact App Store Connect dimensions.
#
# Usage:
#   1. Save your iPhone screenshots (PNG) to:
#        C:\Users\tom99\Desktop\capable-screenshots\input\
#   2. From PowerShell (NOT Git Bash), in the repo root:
#        powershell -ExecutionPolicy Bypass -File scripts\resize-screenshots.ps1
#   3. Resized variants land in:
#        C:\Users\tom99\Desktop\capable-screenshots\output\6.9\  (1320x2868)
#        C:\Users\tom99\Desktop\capable-screenshots\output\6.5\  (1242x2688)
#   4. Upload the 6.9" folder to the iPhone 6.9" slot in App Store Connect
#      and the 6.5" folder to the 6.5" slot.

$src    = "C:\Users\tom99\Desktop\capable-screenshots\input"
$out69  = "C:\Users\tom99\Desktop\capable-screenshots\output\6.9"
$out65  = "C:\Users\tom99\Desktop\capable-screenshots\output\6.5"
$outIp13 = "C:\Users\tom99\Desktop\capable-screenshots\output\ipad-13"

if (-not (Test-Path $src)) {
    Write-Host "Input folder not found: $src"
    Write-Host "Create it and drop your screenshots in, then re-run."
    exit 1
}

New-Item -ItemType Directory -Force -Path $out69, $out65, $outIp13 | Out-Null
Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$inputPath,
        [string]$outputPath,
        [int]$width,
        [int]$height
    )
    $img = [System.Drawing.Image]::FromFile($inputPath)
    # Format24bppRgb is alpha-less; Apple rejects screenshots with an
    # alpha channel even if every pixel is opaque. Fill black first so
    # any semi-transparent pixels in the source composite cleanly to
    # the app's dark bg.
    $bmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Black)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $width, $height)
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$count = 0
Get-ChildItem -Path $src -Filter "*.png" | ForEach-Object {
    $name = $_.BaseName
    Resize-Image -inputPath $_.FullName -outputPath "$out69\$name.png" -width 1320 -height 2868
    Resize-Image -inputPath $_.FullName -outputPath "$out65\$name.png" -width 1242 -height 2688
    Resize-Image -inputPath $_.FullName -outputPath "$outIp13\$name.png" -width 2064 -height 2752
    Write-Host "  Resized $name"
    $count++
}

if ($count -eq 0) {
    Write-Host "No .png files found in $src - drop your screenshots in and re-run."
} else {
    Write-Host ""
    Write-Host "Done. $count screenshots resized."
    Write-Host "  6.9 inch (1320x2868):   $out69"
    Write-Host "  6.5 inch (1242x2688):   $out65"
    Write-Host "  iPad 13 (2064x2752):    $outIp13"
}

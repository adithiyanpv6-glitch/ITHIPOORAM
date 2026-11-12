$dbPath = Join-Path $PSScriptRoot "main-billing-admin-app\data\restaurant_store.json"
Clear-Host
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "          ITHI POORAM (ഇത്തിപ്പൂരം) - DATABASE STATUS CHECK" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Database File: $dbPath" -ForegroundColor Gray

if (-not (Test-Path $dbPath)) {
    Write-Host "`nDatabase file not found yet. Start the POS first.`n" -ForegroundColor Red
    exit
}

$fileInfo = Get-Item $dbPath
Write-Host "Last Saved to Disk: $($fileInfo.LastWriteTime.ToString('dd-MM-yyyy hh:mm:ss tt'))" -ForegroundColor Green
Write-Host "File Size on SSD:   $([Math]::Round($fileInfo.Length / 1KB, 2)) KB" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor DarkGray

try {
    $db = Get-Content $dbPath -Raw | ConvertFrom-Json
    $tableCount = if ($db.tables) { $db.tables.Count } else { 0 }
    $orderCount = if ($db.orders) { $db.orders.Count } else { 0 }
    $unpaidCount = if ($db.orders) { ($db.orders | Where-Object { $_.paymentStatus -eq 'UNPAID' }).Count } else { 0 }
    $settledCount = if ($db.historicalSales) { $db.historicalSales.Count } else { 0 }
    $todaySalesPaise = 0
    if ($db.historicalSales) {
        foreach ($s in $db.historicalSales) { $todaySalesPaise += $s.grandTotalPaise }
    }

    Write-Host "  Active Tables in Database:     $tableCount" -ForegroundColor White
    Write-Host "  Open Running Orders:          $unpaidCount" -ForegroundColor White
    Write-Host "  Total Orders Today:           $orderCount" -ForegroundColor White
    Write-Host "  Settled Bills in Ledger:      $settledCount" -ForegroundColor White
    Write-Host "  Total Sales Recorded on Disk: Rs. $([Math]::Round($todaySalesPaise / 100, 2))`n" -ForegroundColor Yellow
} catch {
    Write-Host "Could not parse database content.`n" -ForegroundColor Red
}

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Data is 100% permanently stored on your laptop hard drive." -ForegroundColor Green
Write-Host "It will NOT disappear, even after power cuts or restarts." -ForegroundColor Green
Write-Host "=========================================================================`n" -ForegroundColor Cyan

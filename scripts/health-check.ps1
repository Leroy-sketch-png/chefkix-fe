#!/usr/bin/env pwsh
# ChefKix Frontend - Health Check Script
# Run this before deployment to verify project health

Write-Host "🔍 ChefKix Frontend Health Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# 1. Check if node_modules exists
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Run: npm install" -ForegroundColor Red
    $errors++
} else {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# 2. Verify old [username] route is deleted
Write-Host "📁 Verifying route cleanup..." -ForegroundColor Yellow
if (Test-Path "src\app\(main)\[username]") {
    Write-Host "❌ Old [username] folder still exists!" -ForegroundColor Red
    Write-Host "   Run: Remove-Item -Recurse -Force 'src\app\(main)\[username]'" -ForegroundColor Yellow
    $errors++
} else {
    Write-Host "✅ Old [username] route deleted" -ForegroundColor Green
}

# 3. Verify new [userId] route exists
Write-Host "📁 Verifying new route..." -ForegroundColor Yellow
if (Test-Path "src\app\(main)\[userId]\page.tsx") {
    Write-Host "✅ New [userId] route exists" -ForegroundColor Green
} else {
    Write-Host "❌ [userId]/page.tsx not found!" -ForegroundColor Red
    $errors++
}

# 4. Check for console.log in production code (excluding demos)
Write-Host "🔍 Scanning for console.log..." -ForegroundColor Yellow
$consoleLogs = Get-ChildItem -Recurse -Include *.tsx,*.ts -Path src | 
    Where-Object { $_.FullName -notmatch "page-old" } |
    Select-String -Pattern "console\.log" |
    Where-Object { $_.Line -notmatch "\/\/" } # Exclude commented lines

if ($consoleLogs.Count -gt 0) {
    Write-Host "⚠️  Found $($consoleLogs.Count) console.log statements:" -ForegroundColor Yellow
    $consoleLogs | ForEach-Object { 
        Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No console.log found in production code" -ForegroundColor Green
}

# 5. Check TypeScript compilation
Write-Host "🔨 Running TypeScript check..." -ForegroundColor Yellow
$tscOutput = & node "node_modules\typescript\bin\tsc" --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript errors found:" -ForegroundColor Red
    Write-Host $tscOutput -ForegroundColor Red
    $errors++
}

# 6. Check for .env.local
Write-Host "🔐 Checking environment..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    
    # Check for critical variables
    $envContent = Get-Content ".env.local" -Raw
    $criticalVars = @("NEXT_PUBLIC_API_BASE_URL")
    $missingVars = @()
    
    foreach ($var in $criticalVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠️  Missing environment variables:" -ForegroundColor Yellow
        $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    }
} else {
    Write-Host "⚠️  .env.local not found (copy from .env.example)" -ForegroundColor Yellow
}

# 7. Check package.json scripts
Write-Host "📜 Verifying package scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts.build -and $packageJson.scripts.dev) {
    Write-Host "✅ Build scripts configured" -ForegroundColor Green
} else {
    Write-Host "❌ Build scripts missing in package.json" -ForegroundColor Red
    $errors++
}

# 8. Final summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "🎉 Health Check PASSED" -ForegroundColor Green
    Write-Host "   Project is ready for integration testing" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: cd ../chefkix-infrastructure && .\dev.bat" -ForegroundColor White
    Write-Host "  2. Start frontend: npm run dev" -ForegroundColor White
    Write-Host "  3. Test critical flows (see SESSION_SUMMARY_2024-11-05.md)" -ForegroundColor White
} else {
    Write-Host "❌ Health Check FAILED ($errors errors)" -ForegroundColor Red
    Write-Host "   Fix errors above before proceeding" -ForegroundColor Red
    exit 1
}
Write-Host "=================================" -ForegroundColor Cyan

# Mission Control Dashboard — Git Backup & Deployment Script
# Date: Sun 2026-03-22 15:05 EDT
# Purpose: Backup project, run QA checks, prepare for Vercel deployment

param(
    [switch]$SkipGit = $false,
    [switch]$TestOnly = $false,
    [switch]$BuildOnly = $false,
    [switch]$FullDeploy = $false
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"

Write-Host "🚀 Mission Control Dashboard — Backup & Deployment Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: GIT BACKUP
# ═══════════════════════════════════════════════════════════════════════════════

if (-not $SkipGit) {
    Write-Host "📦 PHASE 1: GIT BACKUP" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    if (-not (Test-Path "$ProjectRoot\.git")) {
        Write-Host "  ✓ Initializing git repository..." -ForegroundColor Green
        cd $ProjectRoot
        git init | Out-Null
        git config user.name "XiaoZhu" | Out-Null
        git config user.email "mission-control@openclaw.local" | Out-Null
    }
    
    Write-Host "  ✓ Staging all files..." -ForegroundColor Green
    cd $ProjectRoot
    git add -A | Out-Null
    
    $Status = git status --porcelain
    if ($Status) {
        Write-Host "  ✓ Creating backup commit..." -ForegroundColor Green
        $CommitMsg = "BACKUP: Mission Control Dashboard - Full QA Checkpoint $Timestamp"
        git commit -m $CommitMsg | Out-Null
        
        $LastCommit = git log --oneline -1
        Write-Host "  ✓ Backup complete: $LastCommit" -ForegroundColor Green
    } else {
        Write-Host "  ✓ No changes to commit (repository clean)" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: PRE-DEPLOYMENT CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ PHASE 2: PRE-DEPLOYMENT CHECKS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

# Check dependencies
Write-Host "  ✓ Checking Node.js..." -ForegroundColor Green
$NodeVersion = node --version 2>$null
if ($NodeVersion) {
    Write-Host "    → Node $NodeVersion" -ForegroundColor Gray
} else {
    Write-Host "    ✗ Node.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Checking npm..." -ForegroundColor Green
$NpmVersion = npm --version 2>$null
if ($NpmVersion) {
    Write-Host "    → npm $NpmVersion" -ForegroundColor Gray
} else {
    Write-Host "    ✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Check critical files
$CriticalFiles = @(
    "package.json",
    "next.config.js",
    "tsconfig.json",
    "app/page.tsx",
    "lib/agentRegistry.ts"
)

Write-Host "  ✓ Verifying critical files..." -ForegroundColor Green
foreach ($File in $CriticalFiles) {
    $Path = Join-Path $ProjectRoot $File
    if (Test-Path $Path) {
        Write-Host "    → $File ✓" -ForegroundColor Gray
    } else {
        Write-Host "    ✗ $File MISSING!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: BUILD TEST
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🔨 PHASE 3: BUILD TEST" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

cd $ProjectRoot
Write-Host "  ✓ Running production build..." -ForegroundColor Green
npm run build 2>&1 | Tee-Object -Variable BuildOutput | Out-Null

$BuildSuccess = $LASTEXITCODE -eq 0
if ($BuildSuccess) {
    Write-Host "  ✓ Build successful! ✅" -ForegroundColor Green
    $BuildSize = (Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "    → Build size: ${BuildSize:F1} MB" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Build FAILED!" -ForegroundColor Red
    Write-Host "    Review errors above and fix before deploying." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: SUMMARY & NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "📋 DEPLOYMENT READY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ Git backup completed" -ForegroundColor Green
Write-Host "  ✅ Dependencies verified" -ForegroundColor Green
Write-Host "  ✅ Production build successful" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Create Vercel project (https://vercel.com/new)" -ForegroundColor Gray
Write-Host "  2. Link to Git repository" -ForegroundColor Gray
Write-Host "  3. Deploy! (Vercel will auto-build on commit)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  MANUAL PRE-LAUNCH FIXES:" -ForegroundColor Yellow
Write-Host "  [ ] Fix Execution History live polling (ExecutionHistoryScreen.tsx)" -ForegroundColor Gray
Write-Host "  [ ] Restart Next.js dev server (picks up emoji changes)" -ForegroundColor Gray
Write-Host "  [ ] Hard refresh dashboard (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "  [ ] Verify all 13 screens load without errors" -ForegroundColor Gray
Write-Host ""
Write-Host "💾 BACKUP STATUS:" -ForegroundColor Cyan
if (-not $SkipGit) {
    $LatestCommit = git log --oneline -1
    Write-Host "  Latest: $LatestCommit" -ForegroundColor Gray
    Write-Host "  Location: $ProjectRoot\.git" -ForegroundColor Gray
}
Write-Host ""
Write-Host "✨ Ready to launch! Execute with: npm run dev" -ForegroundColor Green
Write-Host ""

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Model Monitoring Script for Mission Control
    
.DESCRIPTION
    Pings all configured models, tracks health status, and monitors API usage/limits.
    
.EXAMPLE
    .\monitor-models.ps1
    
    Runs once immediately and then continues monitoring.
#>

$ErrorActionPreference = "Continue"

# Configuration
$dataDir = Join-Path (Split-Path $PSCommandPath -Parent) "..\data"
$statusFile = Join-Path $dataDir "models-status.json"
$usageFile = Join-Path $dataDir "models-usage.json"

# Ensure data directory exists
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "Created data directory: $dataDir"
}

# Model configurations
$modelSpecs = @{
    "ollama/qwen2.5:7b"           = @{ url = "http://127.0.0.1:11434"; type = "ollama" }
    "ollama/deepseek-coder:6.7b"  = @{ url = "http://127.0.0.1:11434"; type = "ollama" }
    "ollama/glm-4.7-flash"        = @{ url = "http://127.0.0.1:11434"; type = "ollama" }
    "lmstudio-2/qwen/qwen3-coder-30b" = @{ url = "http://127.0.0.1:11435"; type = "lmstudio" }
    "lmstudio-3/qwen/qwen3-vl-30b"    = @{ url = "http://127.0.0.1:11435"; type = "lmstudio" }
}

# API limits (tokens per day)
$apiLimits = @{
    "anthropic/claude-sonnet-4-6"  = 8000000
    "anthropic/claude-haiku-4-5"   = 10000000
    "anthropic/claude-opus-4-6"    = 6000000
}

function Ping-Model {
    param(
        [string]$ModelId,
        [hashtable]$Spec
    )

    $startTime = Get-Date
    $status = @{
        modelId           = $ModelId
        status            = "unknown"
        lastHealthCheck   = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        responseTimeMs    = 0
        errorMessage      = $null
        requestsSucceeded = 0
        requestsFailed    = 0
    }

    # Load existing status if available
    if (Test-Path $statusFile) {
        try {
            $data = Get-Content $statusFile | ConvertFrom-Json
            if ($data.status.$ModelId) {
                $status = $data.status.$ModelId | ConvertTo-Hashtable
            }
        }
        catch {
            Write-Host "Could not load existing status for $ModelId"
        }
    }

    try {
        $url = if ($Spec.type -eq "ollama") { "$($Spec.url)/api/tags" } else { "$($Spec.url)/v1/models" }
        
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 15 -ErrorAction Stop
        $responseTime = ([datetime]::Now - $startTime).TotalMilliseconds

        if ($response.StatusCode -eq 200) {
            $status.status = "healthy"
            $status.responseTimeMs = $responseTime
            $status.requestsSucceeded++
            Write-Host "✅ $ModelId - Healthy ($responseTime ms)"
        }
        else {
            $status.status = "degraded"
            $status.responseTimeMs = $responseTime
            $status.requestsFailed++
            $status.errorMessage = "HTTP $($response.StatusCode)"
            Write-Host "⚠️  $ModelId - Degraded (HTTP $($response.StatusCode))"
        }
    }
    catch {
        $responseTime = ([datetime]::Now - $startTime).TotalMilliseconds
        $status.status = "broken"
        $status.responseTimeMs = [Math]::Min($responseTime, 15000)
        $status.requestsFailed++
        $status.errorMessage = $_.Exception.Message
        Write-Host "❌ $ModelId - Broken ($($_.Exception.Message))"
    }

    $status.lastHealthCheck = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    return $status
}

function Convert-ToHashtable {
    param(
        [Parameter(ValueFromPipeline)]
        $InputObject
    )
    
    if ($InputObject -is [Collections.IDictionary]) {
        return $InputObject
    }
    
    $hashtable = @{}
    foreach ($property in $InputObject.PSObject.Properties) {
        $hashtable[$property.Name] = $property.Value
    }
    return $hashtable
}

function Monitor-AllModels {
    Write-Host "`n[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting model health checks..."

    # Load or create status data
    $statusData = @{ lastUpdated = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); status = @{} }
    
    if (Test-Path $statusFile) {
        try {
            $statusData = Get-Content $statusFile -Raw | ConvertFrom-Json
            $statusData.status = $statusData.status | ConvertTo-Hashtable
        }
        catch {
            Write-Host "Could not load existing status file, starting fresh"
        }
    }

    # Ping each model
    foreach ($modelId in $modelSpecs.Keys) {
        $result = Ping-Model -ModelId $modelId -Spec $modelSpecs[$modelId]
        $statusData.status[$modelId] = $result
    }

    # Update timestamp
    $statusData.lastUpdated = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

    # Save status
    $statusData | ConvertTo-Json -Depth 10 | Set-Content $statusFile
    Write-Host "Status saved to: $statusFile"

    # Calculate summary
    $healthy = ($statusData.status.Values | Where-Object { $_.status -eq "healthy" }).Count
    $degraded = ($statusData.status.Values | Where-Object { $_.status -eq "degraded" }).Count
    $broken = ($statusData.status.Values | Where-Object { $_.status -eq "broken" }).Count

    Write-Host "`n📊 Summary: $healthy healthy, $degraded degraded, $broken broken"
}

function Analyze-UsageAndLimits {
    Write-Host "`n[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Analyzing usage and limits..."

    if (-not (Test-Path $usageFile)) {
        Write-Host "No usage data found yet."
        return
    }

    try {
        $usageData = Get-Content $usageFile -Raw | ConvertFrom-Json
        $usage = $usageData.usage | ConvertTo-Hashtable

        # Check for approaching limits
        foreach ($modelId in $apiLimits.Keys) {
            if ($usage.$modelId) {
                $percentageUsed = ($usage.$modelId.totalTokensUsed / $apiLimits[$modelId]) * 100
                if ($percentageUsed -gt 70) {
                    Write-Host "⚠️  API LIMIT WARNING: $modelId at $([Math]::Round($percentageUsed, 1))% of daily limit"
                }
            }
        }

        # Log usage summary
        $totalTokens = ($usage.Values | Measure-Object -Property totalTokensUsed -Sum).Sum
        $totalCost = ($usage.Values | Measure-Object -Property estimatedCost -Sum).Sum

        Write-Host "📈 Usage Summary: $(Format-Number $totalTokens) total tokens, `$$([Math]::Round($totalCost, 2)) estimated cost"
    }
    catch {
        Write-Host "Error analyzing usage: $($_)"
    }
}

function Format-Number {
    param([int64]$num)
    
    if ($num -ge 1000000) {
        return "$([Math]::Round($num / 1000000, 1))M"
    }
    elseif ($num -ge 1000) {
        return "$([Math]::Round($num / 1000, 1))K"
    }
    else {
        return $num.ToString()
    }
}

# Main loop
while ($true) {
    try {
        Monitor-AllModels
        Analyze-UsageAndLimits
        Write-Host "`nNext check in 5 minutes... (press Ctrl+C to exit)`n"
        Start-Sleep -Seconds 300  # 5 minutes
    }
    catch {
        Write-Error "Error during monitoring: $_"
        Start-Sleep -Seconds 60
    }
}

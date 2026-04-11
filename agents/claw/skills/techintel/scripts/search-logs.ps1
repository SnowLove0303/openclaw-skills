# TechIntel 日志搜索工具
param(
    [string]$Pattern = "techintel|e4166ba9",
    [int]$LastHours = 24,
    [string]$Level = "ALL"
)

$ErrorActionPreference = "SilentlyContinue"

# 颜色定义
function Get-LevelColor($msg) {
    if ($msg -match "error|fail|fatal|exception|❌") { return "Red" }
    if ($msg -match "warn|warning") { return "Yellow" }
    if ($msg -match "success|✅|completed|done") { return "Green" }
    return "White"
}

# 时间范围过滤
$cutoff = (Get-Date).AddHours(-$LastHours)

# 收集日志
$logLines = @()

# 1. OpenClaw 主日志
$openclawLog = & openclaw logs 2>$null
if ($openclawLog) {
    $logLines += $openclawLog -split "`n" | ForEach-Object {
        [PSCustomObject]@{
            Source = "openclaw"
            Raw    = $_
            Time   = $_
        }
    }
}

# 2. Windows 应用日志 (PowerShell)
$pwshEvents = Get-WinEvent -FilterHashtable @{
    LogName = 'Microsoft-Windows-PowerShell/Operational'
    StartTime = $cutoff
} -MaxEvents 200 -ErrorAction SilentlyContinue | ForEach-Object {
    [PSCustomObject]@{
        Source = "pwsh"
        Raw    = $_.Message
        Time   = $_.TimeCreated.ToString("HH:mm:ss")
    }
}
if ($pwshEvents) { $logLines += $pwshEvents }

# 过滤并输出
$matched = $logLines | Where-Object {
    $_.Raw -match $Pattern -and
    (($_.Time -match '^\d{2}:\d{2}:\d{2}') -or $_.Source -eq "pwsh")
} | Sort-Object Time

# 输出
Write-Host ""
Write-Host "━━━ TechIntel 日志搜索结果 ━━━" -ForegroundColor Cyan
Write-Host "  关键词: $Pattern" -ForegroundColor Gray
Write-Host "  时间范围: 最近 $LastHours 小时" -ForegroundColor Gray
Write-Host "  匹配行数: $($matched.Count)" -ForegroundColor Gray
Write-Host ""

if ($matched.Count -eq 0) {
    Write-Host "  未找到匹配的日志记录" -ForegroundColor DarkGray
    Write-Host ""
    exit 0
}

$lastSource = ""
foreach ($entry in $matched) {
    # 来源分隔
    if ($entry.Source -ne $lastSource) {
        Write-Host ""
        Write-Host "  ┄┄ $("${Global:$entry.Source}" + " ──" ) " -ForegroundColor DarkCyan
        $lastSource = $entry.Source
    }

    # 时间戳提取
    $ts = ""
    if ($entry.Raw -match '(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})') {
        $ts = $matches[1] -replace 'T', ' '
    } elseif ($entry.Time -match '^\d{2}:\d{2}:\d{2}') {
        $ts = $entry.Time
    }

    # 状态图标
    $icon = "  "
    if ($entry.Raw -match "✅|success|completed") { $icon = "✅" }
    elseif ($entry.Raw -match "❌|fail|error|fatal") { $icon = "❌" }
    elseif ($entry.Raw -match "warning|warn") { $icon = "⚠️"  }
    elseif ($entry.Raw -match "start|启动") { $icon = "🚀" }
    elseif ($entry.Raw -match "collect-data|数据收集") { $icon = "📡" }

    # 提取 TechIntel 相关行
    if ($entry.Raw -match '\[TechIntel\]|\[techintel\]') {
        $line = $entry.Raw -replace '^\s+|\s+$', ''
        $color = Get-LevelColor $line
        Write-Host "  $icon [$ts] $line" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "━━━ 摘要 ━━━" -ForegroundColor Cyan

# 统计
$successCount = ($matched | Where-Object { $_.Raw -match "✅|success|completed" }).Count
$failCount = ($matched | Where-Object { $_.Raw -match "❌|fail|error" }).Count
$collectCount = ($matched | Where-Object { $_.Raw -match "收集数据|collect" }).Count

Write-Host "  成功: $successCount  次" -ForegroundColor Green
Write-Host "  失败: $failCount  次" -ForegroundColor Red
Write-Host "  数据收集: $collectCount 次" -ForegroundColor Cyan
Write-Host ""

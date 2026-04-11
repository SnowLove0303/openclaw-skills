$ErrorActionPreference = 'Continue'
$repo = "SnowLove0303/openclaw-skills"
$baseDir = "F:\AI\Openclaw\workspace\agents\claw"

# 工具函数：上传文件到 GitHub
function Upload-File($localPath, $remotePath) {
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $contentB64 = [Convert]::ToBase64String($bytes)
    
    $sha = ""
    try {
        $sha = (gh api "repos/$repo/contents/$remotePath" --jq .sha 2>$null).Trim()
    } catch {}
    
    $msg = "chore: sync $remotePath"
    
    $result = $null
    if ($sha) {
        $result = gh api "repos/$repo/contents/$remotePath" `
            --method PUT `
            -f message="$msg" `
            -f content="$contentB64" `
            -f encoding="base64" `
            -f sha="$sha" 2>&1
    } else {
        $result = gh api "repos/$repo/contents/$remotePath" `
            --method PUT `
            -f message="$msg" `
            -f content="$contentB64" `
            -f encoding="base64" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $remotePath"
    } else {
        Write-Host "  FAIL: $remotePath"
        Write-Host "  $result"
    }
}

# 上传所有 skill 文件
Get-ChildItem "$baseDir\skills" -Directory | ForEach-Object {
    $skill = $_.Name
    Write-Host "`n=== Skill: $skill ==="
    
    Get-ChildItem $_.FullName -Recurse -File | ForEach-Object {
        $relPath = $_.FullName.Replace("$baseDir\", "").Replace("\", "/")
        $remotePath = "agents/$relPath"
        Upload-File $_.FullName $remotePath
    }
}

# 更新 MEMORY.md
Write-Host "`n=== MEMORY.md ==="
Upload-File "$baseDir\MEMORY.md" "agents/MEMORY.md"

# 更新 push-to-github.ps1
Write-Host "`n=== push-to-github.ps1 ==="
Upload-File "$baseDir\push-to-github.ps1" "agents/push-to-github.ps1"

Write-Host "`nDone!"

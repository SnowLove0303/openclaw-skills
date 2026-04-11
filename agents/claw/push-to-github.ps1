$ErrorActionPreference = 'Continue'
$repo = "SnowLove0303/openclaw-skills"
$baseDir = "F:\AI\Openclaw\workspace\agents\claw"

Get-ChildItem $baseDir -Recurse -File | ForEach-Object {
    $relPath = $_.FullName.Replace("$baseDir\", "").Replace("\", "/")
    $remotePath = "agents/$relPath"
    
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $contentB64 = [Convert]::ToBase64String($bytes)
    
    # 获取现有 SHA
    $sha = ""
    try {
        $sha = (gh api "repos/$repo/contents/$remotePath" --jq .sha 2>$null).Trim()
    } catch {}
    
    Write-Host "Processing: $remotePath (sha=$sha)"
    
    # 构建 JSON 到临时文件
    $tmpJson = "$env:TEMP\gh_json_$([guid]::NewGuid().ToString('N')).json"
    $body = @{
        message = "chore: sync $relPath"
        content = $contentB64
        encoding = "base64"
    }
    if ($sha -ne "") {
        $body.sha = $sha
    }
    $body | ConvertTo-Json -Depth 5 | Out-File -FilePath $tmpJson -Encoding UTF8 -NoNewline
    
    $result = gh api "repos/$repo/contents/$remotePath" --method PUT --input $tmpJson 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $remotePath"
    } else {
        Write-Host "  FAIL: $remotePath - $result"
    }
    
    Remove-Item $tmpJson -ErrorAction SilentlyContinue
}

Write-Host "Done!"

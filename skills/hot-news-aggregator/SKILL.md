---
name: hot-news-aggregator
version: 1.0.3
description: "国内外社会、科技、军事新闻汇总。自动搜索、筛选、整理新闻要点。Use When 需要获取最新的国内外社会、科技、军事新闻，并且希望自动筛选和整理新闻要点时。"
license: MIT
---

# Hot News Aggregator (热门新闻聚合器)

聚合国内外社会、科技、军事新闻，自动筛选要点。

## 新闻源

国内科技

- 36氪: `https://36kr.com/information/tech`
- 机器之心: `https://www.jiqizhixin.com`
- 量子位: `https://www.1baijia.com`
- IT之家: `https://www.ithome.com`

国内军事

- 观察者网: `https://www.guancha.cn`
- 澎湃新闻: `https://www.thepaper.cn`
- 腾讯军事: `https://new.qq.com/om/mil`

国际科技

- TechCrunch: `https://techcrunch.com`
- The Verge: `https://www.theverge.com`
- Wired: `https://www.wired.com`
- Ars Technica: `https://arstechnica.com`

国际军事

- Defense News: `https://www.defensenews.com`
- Jane's Defence: `https://www.janes.com`
- Military Times: `https://www.militarytimes.com`

## 工作流

1. **搜索** - 用 `web_search` 或 `web_fetch` 工具搜索各源
2. **筛选** - 过滤重复、过期、不可靠来源
3. **整理** - 按类别整理，每条含标题、来源、要点
4. **输出** - 生成结构化汇总

## 可信度规则

**优先：**

- 官方媒体报道
- 权威机构发布

**谨慎：**

- 论坛帖子
- 匿名消息
- 二手转载

## 输出格式

```markdown
## 科技新闻

1. [标题](链接)
   来源：xxx | 时间：xxx
   要点：xxx

## 军事新闻

1. [标题](链接)
   来源：xxx | 时间：xxx
   要点：xxx
```

## ⚡ 自动保存到 Obsidian（每次执行后必须）

**Obsidian 路径**: `E:\360MoveData\Users\Administrator\Documents\Obsidian Vault\AI-News\`

**文件名格式**: `YYYY-MM-DD.md`（当日日期）

**保存流程**（每次搜索后自动执行，无需用户提示）：
1. 整理好新闻内容后
2. 生成 Obsidian 格式的 markdown 文件
3. 执行 PowerShell 保存命令：
   ```powershell
   $content = "文件内容（markdown）"
   $path = "E:\360MoveData\Users\Administrator\Documents\Obsidian Vault\AI-News\YYYY-MM-DD.md"
   New-Item -ItemType File -Path $path -Force | Out-Null
   Set-Content -Path $path -Value $content -Encoding UTF8
   ```
4. 确认保存成功后再回复用户

**文件模板**：
```markdown
# 📰 今日新闻汇总

**日期**: YYYY-MM-DD
**来源**: 36氪 / 机器之心 / TechCrunch / The Verge / 等

## 国内科技

## 国际科技

## 军事动态

## 其他要点

---
*由 OpenClaw AI 自动采集 | Hot News Aggregator*
```

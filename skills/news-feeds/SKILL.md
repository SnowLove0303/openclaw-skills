---
name: news-feeds
description: Fetch latest news headlines from major RSS feeds (BBC, Reuters, AP, Al Jazeera, NPR, The Guardian, DW).
metadata: {"openclaw":{"requires":{"bins":["python3"]}}}
---

# News Feeds Skill

Fetch current news headlines and summaries from major international RSS feeds. Zero API keys, zero dependencies — uses only Python stdlib and HTTP.

## Available Commands

### Command: news
**What it does:** Fetch latest headlines from all configured feeds (or a specific source).
**How to execute:**
```bash
python3 scripts/news.py
```

### Command: news from a specific source
**What it does:** Fetch headlines from one source only.
**How to execute:**
```bash
python3 scripts/news.py --source bbc
python3 scripts/news.py --source reuters
python3 scripts/news.py --source ap
python3 scripts/news.py --source guardian
python3 scripts/news.py --source aljazeera
python3 scripts/news.py --source npr
python3 scripts/news.py --source dw
```

### Command: news by topic
**What it does:** Fetch headlines filtered to a specific topic/keyword.
```bash
python3 scripts/news.py --topic "climate"
python3 scripts/news.py --source bbc --topic "ukraine"
```

### Command: news with more items
**What it does:** Control how many items per feed (default 8).
```bash
python3 scripts/news.py --limit 20
```

### Command: list sources
**What it does:** Show all available feed sources and their categories.
```bash
python3 scripts/news.py --list-sources
```

## Available Sources

| Source       | Categories                                      |
|-------------|------------------------------------------------|
| bbc         | top, world, business, tech, science, health     |
| reuters      | top, world, business, tech, science, health     |
| ap          | top                                             |
| guardian    | top, world, business, tech, science             |
| aljazeera   | top                                             |
| npr         | top                                             |
| dw          | top                                             |

## When to Use

- User asks for latest news, current events, headlines
- User wants a news briefing or daily digest
- User asks "what's happening in the world"
- User asks about news on a specific topic
- User asks for a morning briefing

## Output Format

Returns markdown with headlines, short descriptions, publication times, and links. Grouped by source.

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
# 📰 AI 科技新闻日报

**日期**: YYYY-MM-DD
**来源**: 国际 RSS feeds (BBC/Reuters/AP/The Guardian/DW/Al Jazeera/NPR)

## 今日要闻
（按重要性排序的 headlines）

## 科技动态
（tech 分类新闻）

## 其他
（其他分类）

---
*由 OpenClaw AI 自动采集*
```

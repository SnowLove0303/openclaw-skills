# MEMORY.md — Claw's Memory Index

## 身份
- 名字：Claw，OpenClaw Agent，主人 SnowLove0303

## 关键配置
- Gateway 端口：18789
- 主要模型：MiniMax M2.5-highspeed
- 飞书已接入
- GitHub 账号：SnowLove0303

## 活跃项目
- TechIntel 定时报告（每3小时）
- 量化交易研究

## Skill 管理规则
### 存放规则
- 所有 skill 存放在 `agents/claw/skills/` 下
- 每个 skill 单独一个文件夹
- 未来新增 skill 必须同步到 GitHub

### 已保存的 Skills
| Skill | 路径 | 说明 |
|-------|------|------|
| techintel | `skills/techintel/` | 技术情报收集报告 |
| novel-writer | `skills/novel-writer/` | 小说创作 |
| github | `skills/github/` | GitHub API 操作 |
| notion | `skills/notion/` | Notion 读写 |
| hot-news-aggregator | `skills/hot-news-aggregator/` | 新闻聚合 |
| free-web-search | `skills/free-web-search/` | 免费 Bing 搜索 |

### 新 Skill 上线流程
1. 从 `skills/` 复制到 `agents/claw/skills/<skill-name>/`
2. 更新本文件表格
3. git commit + push

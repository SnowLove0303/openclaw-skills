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
| Skill | 路径 | 说明 | 状态 |
|-------|------|------|------|
| techintel | `skills/techintel/` | 技术情报收集报告 | ✅ |
| novel-writer | `skills/novel-writer/` | 小说创作 | ✅ |
| github | `skills/github/` | GitHub API 操作 | ✅ |
| notion | `skills/notion/` | Notion 读写 | ✅ |
| hot-news-aggregator | `skills/hot-news-aggregator/` | 新闻聚合 | ✅ |
| free-web-search | `skills/free-web-search/` | 免费 Bing 搜索 | ✅ |
| jq | `skills/jq/` | 命令行 JSON 处理 | ✅ 已安装 |
| hermes-agent | `skills/hermes-agent/` | Nous Research AI Agent 框架 | ✅ |
| dify | `skills/dify/` | LLM 应用低代码开发平台 | ✅ |
| caveman | `skills/caveman/` | Token 压缩工具（说话风格） | ✅ |

### 工具安装状态
- **jq**: ✅ 已安装 `C:\Windows\jq.exe`（v1.7.1）
- **hermes-agent**: 📋 OpenClaw 集成（通过 agentic 模式调用）
- **dify**: 📋 Docker 部署（本地）或 Dify Cloud（云端）
- **caveman**: 📋 Prompt 技巧（无需安装）

### 新 Skill 上线流程
1. 从 `skills/` 复制到 `agents/claw/skills/<skill-name>/`
2. 更新本文件表格
3. 调用 push-to-github.ps1 推送到 GitHub

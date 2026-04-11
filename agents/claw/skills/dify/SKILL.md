# dify Skill

## 基本信息
- **名称**: Dify
- **仓库**: langgenius/dify
- **Stars**: 137,244（GitHub Top-10 开源 LLM 项目）
- **语言**: TypeScript + Python
- **描述**: Production-ready platform for agentic workflow development

## 核心能力

### 工作流编排
- 可视化画布，拖拽节点
- 节点类型：LLM / 工具 / 条件 / 循环 / RAG / MCP

### RAG（检索增强生成）
- 内置文档解析 + 向量检索
- 支持主流向量数据库（Milvus / PGvector / Qdrant）

### 多模型支持
- OpenAI / Claude / Gemini / Ollama / DeepSeek / 本地模型
- 模型管理 + 密钥管理

### MCP 集成
- Model Context Protocol 原生支持
- 快速接入外部工具

### API 发布
- 一键将工作流发布为 REST API
- 支持 Webhook 触发

### 企业版
- SSO / LDAP / 权限管理 / 审计日志

## 技术栈
- 前端：Next.js + TypeScript
- 后端：Python（Flask/FastAPI）
- 数据库：PostgreSQL + Redis

## 安装部署
```bash
# Docker 快速部署
git clone https://github.com/langgenius/dify.git
cd dify/docker
docker-compose up -d

# 或使用 Dify Cloud（无需部署）
# https://cloud.dify.ai
```

## OpenClaw 集成
通过 MCP 协议将 Dify 工作流暴露给 OpenClaw：
1. 在 Dify 中创建 Agent 工作流
2. 开启"启用 API"选项
3. 通过 `exec` 调用 Dify API
4. 将结果集成到 OpenClaw skill

## 适用场景
- 企业内部 LLM 应用快速搭建
- RAG 知识库问答系统
- Agent 工作流编排与发布
- 多模型对比测试

## 竞品对比
| 平台 | Stars | 特点 |
|------|-------|------|
| **Dify** | 137k | 功能最完整，UI 最成熟 |
| LangFlow | ~45k | 纯 Python，学术向 |
| Flowise | ~22k | 最轻量，LangChain 封装 |

## 数据来源
https://github.com/langgenius/dify

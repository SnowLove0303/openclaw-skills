# hermes-agent Skill

## 基本信息
- **名称**: hermes-agent
- **仓库**: nousresearch/hermes-agent
- **Stars**: 56,413
- **语言**: Python
- **描述**: "The agent that grows with you" — Nous Research 开源 AI Agent 框架

## 核心能力
- 渐进式成长：Agent 能随着任务累积经验、自我优化
- 多模型支持：OpenAI / Claude / Ollama
- 内置记忆系统：长期记忆、经验库
- Skill 插件体系
- Inspector 调试界面
- OpenClaw 官方集成推荐

## 生态
- hermes-workspace: 原生 Web 工作区（chat/terminal/memory/skills/inspector）
- hermes-paperclip-adapter: 商业适配器
- hermes-agent-orange-book: 中文入门教程

## 集成方式
### 方式一：通过 OpenClaw agentic 模式调用
```bash
openclaw agents spawn --runtime hermes --model claude
```

### 方式二：作为外部 MCP 工具
hermes-agent 支持 MCP 协议，可通过 openclaw-mcp 暴露为工具：
```bash
openclaw mcp add hermes -- npx @nousresearch/hermes-agent
```

## 相关标签
hermes-agent, ai-agent, claude-code, openclaw, nous-research, ai

## 数据来源
https://github.com/nousresearch/hermes-agent

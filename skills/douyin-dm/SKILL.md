---
name: douyin-dm
description: 抖音私信轮询 + AI 自动回复。定期检查抖音创作者中心私信列表，提取未回复私信，调用 AI 生成回复并发送。依赖 wenyg/douyin-creator-tools 的登录态。
---

# 抖音私信 AI 自动回复 Skill

## 功能

- 轮询抖音创作者中心私信列表（新消息检测）
- 调用 OpenClaw 已连接模型生成个性化回复
- 支持审批模式 / 干跑模式 / 全自动模式
- 记录已回复消息，防止重复回复
- 通过 OpenClaw 飞书/Telegram 通知处理结果

## 前置要求

1. 先安装依赖：
   ```bash
   cd skills/douyin-dm
   npm install
   ```

2. 使用 `wenyg/douyin-creator-tools` 完成一次登录：
   ```bash
   git clone https://github.com/wenyg/douyin-creator-tools.git /path/to/douyin-creator-tools
   cd /path/to/douyin-creator-tools
   npm install
   npx playwright install chromium
   npm run auth   # 扫码登录抖音创作者中心
   ```
   登录态保存在 `.playwright/douyin-profile`，Skill 会复用此目录。

3. 在 `openclaw.json` 中配置（路径改为你的实际路径）：
   ```json
   {
     "plugins": {
       "entries": {
         "douyin-dm": {
           "path": "/path/to/openclaw-workspace/skills/douyin-dm"
         }
       }
     }
   }
   ```

## 使用方式

```
检查私信            → 列出所有未回复私信，让 AI 生成回复候选
私信审批 [yes]      → 对生成的所有回复进行逐条审批后发送
私信干跑            → 预览 AI 生成的回复，但不实际发送
私信全自动          → 直接发送 AI 生成的回复（无需审批）
私信状态            → 查看今日处理统计
```

## 工作流程

```
定时触发（或手动）
    ↓
Playwright 打开创作者中心私信页
    ↓
读取已有回复记录（state.json）
    ↓
提取当前页面所有私信列表
    ↓
过滤出未回复的新私信
    ↓
对每条私信调用 AI 生成回复
    ↓
[根据模式] 审批 / 干跑 / 直接发送
    ↓
更新 state.json 记录已回复 ID
    ↓
飞书/ TG 通知处理结果
```

## 私信页面 URL

`https://creator.douyin.com/creator-micro/chat/home`

## 配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `pollIntervalMinutes` | Cron 控制 | 轮询间隔，由 OpenClaw cron 决定 |
| `maxMessagesPerRun` | 20 | 每次最多处理的消息数 |
| `minMessageLength` | 3 | 忽略短消息（如"hi""ok"） |
| `replyDelayMin` | 5 | 自动模式发送间隔（秒） |
| `replyDelayMax` | 30 | 自动模式发送间隔上限 |

## 状态文件

私信回复状态保存在 `scripts/state.json`，包含：
- 已回复的消息 ID 列表
- 每条消息的回复内容
- 处理时间戳

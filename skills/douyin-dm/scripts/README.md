# 抖音私信 AI 自动回复 — 使用指南

## 一、整体架构

```
OpenClaw (cron / 手动触发)
    ↓
dm-agent.mjs (Node.js + Playwright)
    ↓
复用 douyin-creator-tools 的登录态
    ↓
打开创作者中心私信页
    ↓
提取未回复私信
    ↓
调用 OpenClaw 模型生成 AI 回复
    ↓
审批 / 干跑 / 全自动发送
    ↓
更新 state.json + 飞书通知
```

## 二、安装步骤

### 步骤 1：克隆并登录 douyin-creator-tools

```bash
git clone https://github.com/wenyg/douyin-creator-tools.git C:\tools\douyin-creator-tools
cd C:\tools\douyin-creator-tools
npm install
npx playwright install chromium
npm run auth
```

扫码登录抖音创作者中心（只需执行一次）

### 步骤 2：安装本 Skill

```bash
cd skills/douyin-dm
npm install
```

### 步骤 3：配置 OpenClaw（可选）

设置环境变量或 openclaw.json：
```json
{
  "skills": {
    "douyin-dm": {
      "env": {
        "DOUYIN_CREATOR_TOOLS": "C:\\tools\\douyin-creator-tools"
      }
    }
  }
}
```

## 三、使用方式

### 手动触发（开发调试阶段推荐）

```bash
# 1. 检查私信 + 生成 AI 回复候选
npm run start check

# 2. 审批后发送
npm run start approve

# 3. 仅预览（不发送）
npm run start dryrun

# 4. 全自动发送
npm run start auto

# 5. 查看今日统计
npm run start status
```

### OpenClaw 定时任务（推荐日常使用）

在 OpenClaw 中配置 cron：
```
/openclaw cron add --name "抖音私信处理" --cron "0 */30 * * *"
```

触发命令：
```
抖音私信检查 → 审批并发送
```

## 四、模式说明

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `check` | 提取私信 + AI 生成候选，保存待审批 | 每天第一次处理 |
| `approve` | 逐条审批后发送 | 正式运营（安全可控）|
| `dryrun` | 预览所有回复，不发送 | 检查 AI 质量 |
| `auto` | 直接发送 | 信任 AI 质量后 |

## 五、页面选择器适配

⚠️ **重要**：抖音创作者中心页面结构可能随时改版，需要手动适配选择器。

调试方法：
```bash
npm run start check
# 浏览器会保持打开，截图保存到 scripts/debug-*.png
# 查看截图，对比脚本中的 CSS 选择器
```

常见选择器失效情况及修复：

```javascript
// 私信列表条目
'[class*="chat-item"]'        // 可能变为
'[class*="message-item"]'

// 消息气泡
'[class*="bubble"]'           // 可能变为
'[class*="chat-bubble"]'

// 输入框
'textarea[class*="input"]'    // 可能变为
'div[contenteditable="true"]'
```

打开 `scripts/dm-agent.mjs`，搜索 `selectors` 数组，按页面实际情况调整。

## 六、回复质量调优

修改 `dm-agent.mjs` 中的 `systemPrompt`：

```javascript
const systemPrompt = `你是一个抖音账号运营助手...
- 语气亲切、专业...
- 回复简洁，一般不超过 100 字
- 不确定的问题不要乱答
...`;
```

## 七、注意事项

1. **账号安全**：抖音对自动化行为有检测限制，建议每次处理间隔不少于 30 秒
2. **登录态**：登录态约 30 天过期，过期后重新 `npm run auth`
3. **日志文件**：截图和状态文件保存在 `scripts/` 目录
4. **回复状态**：`state.json` 记录已回复 ID，重启后不重复回复

# HEARTBEAT.md - TechIntel 定时任务配置

> **⚠️ 注意**：定时任务已通过 OpenClaw cron 管理，不再依赖 HEARTBEAT.md 机制。
> 完整的工作流定义见 skill `techintel`。

---

## 当前定时任务状态

- **Cron Job ID**: `e4166ba9-b14f-4c59-b41a-fc4b8f3038d8`
- **名称**: TechIntel技术情报
- **频率**: 每 3 小时（`0 */3 * * *`）
- **时区**: Asia/Shanghai
- **超时**: 180 秒
- **状态**: `openclaw cron list` 查看

## 管理命令

```bash
# 查看状态
openclaw cron list

# 手动触发
openclaw cron run e4166ba9-b14f-4c59-b41a-fc4b8f3038d8

# 修改超时
openclaw cron edit --timeout-seconds 180 e4166ba9-b14f-4c59-b41a-fc4b8f3038d8

# 查看 TechIntel 日志（推荐）
node skills\techintel\scripts\search-logs.js
node skills\techintel\scripts\search-logs.js --hours 48
node skills\techintel\scripts\search-logs.js --pattern "error|fail"
```

## 输出位置

- 数据文件: `F:\AI\Openclaw\workspace\TechIntel\data.json`
- 报告（workspace）: `F:\AI\Openclaw\workspace\TechIntel\YYYY-MM-DD-HH.md`
- 报告（Obsidian）: `E:\360MoveData\Users\Administrator\Documents\Obsidian Vault\TechIntel\YYYY-MM-DD-HH.md`

## 技术栈

- 数据收集: `skills/techintel/scripts/collect-data.js`（Node.js + HTTPS + Tavily API）
- 深度分析: AI agent 基于 `skills/techintel/references/report-template.md` 格式生成报告
- 定时调度: OpenClaw cron (`isolated` session, `--no-deliver`)

## 参考模板

报告格式严格参照：`E:\360MoveData\Users\Administrator\Documents\Obsidian Vault\TechIntel\2026-04-04-13.md`

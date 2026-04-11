---
name: techintel
description: This skill should be used when the user asks to generate a TechIntel (技术情报) report, run the tech intelligence task, check/update/configure the TechIntel scheduled task, or search for AI/GitHub/OpenClaw news and trends.
---

# TechIntel 技术情报系统

定期生成 AI 技术情报深度分析报告，数据来源包括 GitHub Trending、AI 行业新闻、OpenClaw/Claude Code 动态。

## 报告格式参考

参照 `references/report-template.md`，格式严格包含：
- 一、GitHub 热门项目（5个项目，每个含概述/亮点/影响/建议）
- 二、重点项目监控（OpenClaw/Claude Code 最新动态）
- 三、行业新闻与趋势解读（2-3 个趋势）
- 四、即时行动清单（今天/本周/本月）
- 五、关键洞察总结（5-7 条）

## 工作流程

### 场景 A：手动生成报告（推荐）

1. **运行数据收集**
   ```
   node F:\AI\Openclaw\workspace\skills\techintel\scripts\collect-data.js
   ```
   输出：`F:\AI\Openclaw\workspace\TechIntel\data.json`

2. **读取数据**
   读取 `F:\AI\Openclaw\workspace\TechIntel\data.json`，理解每个条目的内容

3. **生成深度报告**
   - 报告时间：当前时间
   - 保存路径：`F:\AI\Openclaw\workspace\TechIntel\YYYY-MM-DD-HH.md`
   - 格式：严格参照 `references/report-template.md`
   - 注意：报告必须有真正的分析内容，不是简单的摘要堆砌
   - 对于 HTML 残留内容，用常识判断实际主题并深入分析
   - 如果数据质量差，要补充相关背景知识

4. **复制到 Obsidian**
   ```
   Copy-Item "F:\AI\Openclaw\workspace\TechIntel\{filename}.md" "E:\360MoveData\Users\Administrator\Documents\Obsidian Vault\TechIntel\{filename}.md" -Force
   ```

### 场景 B：检查/管理定时任务

**查看状态**
```
openclaw cron list
```

**手动触发一次**
```
openclaw cron run {job-id}
```

当前配置的 cron job：
- ID: `e4166ba9-b14f-4c59-b41a-fc4b8f3038d8`
- 名称: TechIntel技术情报
- 频率: 每 3 小时（`0 */3 * * *`）
- 时区: Asia/Shanghai
- 执行内容: 运行 `collect-data.js` + AI 深度分析 + 复制到 Obsidian

**修改 cron 任务**
```
openclaw cron edit --message "新的提示词" {job-id}
openclaw cron edit --timeout-seconds 180 {job-id}
```

**删除 cron 任务**
```
openclaw cron rm {job-id}
```

**查看执行日志（推荐）**
```
node skills\techintel\scripts\search-logs.js
node skills\techintel\scripts\search-logs.js --hours 48
node skills\techintel\scripts\search-logs.js --pattern "error|fail"
```

### 场景 C：更新报告格式模板

如需修改报告格式，先读取 `references/report-template.md`，理解新格式要求，然后重新生成近期报告。

## 输出规范

- 报告语言：中文，专业术语可保留英文
- 每个项目必须包含：项目概述、技术亮点、行业影响、建议行动
- 行业趋势必须包含：证据、深度分析、影响判断、建议行动
- 数据必须可溯源（附来源 URL）
- **⚠️ 严格只包含报告生成当日的内容，历史旧闻一律排除**

## 已知限制

- 大多数现代网站（GitHub、YouTube、Twitter）使用 JS 渲染，HTTP fetch 拿不到正文内容，需要根据标题和 Tavily 摘要判断主题
- 自动生成质量可能不如手动深度分析，如需高质量报告建议手动触发

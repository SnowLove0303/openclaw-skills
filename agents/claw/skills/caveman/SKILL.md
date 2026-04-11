# caveman Skill

## 基本信息
- **名称**: Caveman
- **仓库**: JuliusBrussee/caveman
- **Stars**: 16,428
- **语言**: Python
- **描述**: "why use many token when few token do trick" — Claude Code skill that cuts 65% of tokens by talking like caveman

## 核心原理

Caveman 是一种**极度简洁的说话风格**，用于压缩 LLM 输出 token：

```
❌ 正常表达：I would like to recommend that you consider implementing the feature
✅ Caveman 风格：me think do thing
```

**效果：压缩 65% token**，API 费用降低 2/3。

## 使用场景

### 适合 ✅
- 代码注释（简洁即可）
- 日志输出
- 草稿 / 内部笔记
- 系统提示词（system prompt）
- CLI 工具输出

### 不适合 ❌
- 正式文档
- 对外报告
- 需要精确语义的场景

## 在 OpenClaw 中的应用

### 场景1：降低模型调用成本
在非正式输出时使用 caveman 风格，减少 token 消耗：
```
用户：请总结今天的 TechIntel 报告
→ 以简洁风格输出核心要点（每条不超过10字）
```

### 场景2：系统提示词压缩
将冗长的 system prompt 简化为关键指令，减少上下文占用。

### 场景3：Claude Code 场景
安装到 Claude Code：
```bash
# 从 https://github.com/JuliusBrussee/caveman 安装
# 在 Claude Code 中激活 caveman skill
```

## 技术实现
通过 Prompt Engineering 实现，无需额外依赖库。

## 数据来源
https://github.com/JuliusBrussee/caveman

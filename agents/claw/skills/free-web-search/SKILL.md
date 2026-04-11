---
name: free-web-search
description: 免费Bing搜索，带今日日期，稳定可靠
version: 7.0
author: free-web-search
tools:
  - name: web_search
    description: 联网搜索
    script: scripts/web_search.py
    parameters:
      query:
        type: string
        description: 搜索关键词，简洁明确
        required: true
      max:
        type: integer
        description: 最大返回条数
        required: false
      full:
        type: integer
        description: 抓取前N条全文
        required: false
---

# free-web-search
使用 Bing 搜索，自动带上今日日期，确保内容最新。

## 搜索词优化经验

**问题：** 中文分词容易出错，简短词组可能被拆分导致结果不准。

**示例：**
- ❌ "美伊战争" → 被拆成"美"字，返回"美的空调"、"美缝"等无关结果
- ✅ "美国伊朗冲突" 或 "以色列伊朗冲突" → 结果精准

**建议：**
1. 避免使用简写/简称（如"美伊"、"俄乌"），用完整名称（"美国伊朗"、"俄罗斯乌克兰"）
2. 如果简称搜索结果不准，自动尝试展开为完整名称重搜
3. 搜索国际事件时，优先用"国家A+国家B+冲突/战争"格式
# jq Skill

## 基本信息
- **名称**: jq
- **仓库**: jqlang/jq
- **Stars**: 34,392
- **语言**: C
- **描述**: Command-line JSON processor — 命令行 JSON 处理工具

## 安装状态
- ✅ 已安装：`C:\Windows\jq.exe`（jq 1.7.1）
- 验证命令：`C:\Windows\jq.exe --version`

## 核心用法

### 基本过滤
```bash
# 读取 JSON 对象字段
echo '{"name":"Claw","age":1}' | C:\Windows\jq.exe ".name"

# 数组索引
echo '[1,2,3]' | C:\Windows\jq.exe ".[0]"

# 数组切片
echo '[1,2,3,4,5]' | C:\Windows\jq.exe ".[0:3]"
```

### 高级查询
```bash
# 过滤条件
cat data.json | C:\Windows\jq.exe '.users[] | select(.age > 21)'

# 投影（只取某些字段）
cat data.json | C:\Windows\jq.exe '.users[] | {name: .name, city: .address.city}'

# 运算
echo '{"x":1}' | C:\Windows\jq.exe '.x + 2'

# 管道组合
cat data.json | C:\Windows\jq.exe '.data | map(select(.active == true))'

# 数组构建
echo '[1,2,3]' | C:\Windows\jq.exe 'map(. * 2)'

# 分组
echo '[{"k":"a","v":1},{"k":"b","v":2}]' | C:\Windows\jq.exe 'group_by(.k)'

# 去重
echo '[1,2,2,3]' | C:\Windows\jq.exe 'unique'

# 字符串模板
echo '{"name":"Claw"}' | C:\Windows\jq.exe '"Hello, \(.name)!"'

# 正则匹配
echo '{"email":"test@example.com"}' | C:\Windows\jq.exe '.email | test("^[a-z]+@")

# 空值处理
echo '{"x":null}' | C:\Windows\jq.exe '.x // "default"'
```

### AI 场景实战
```bash
# 解析 API 响应
curl -s https://api.github.com/repos/nousresearch/hermes-agent | C:\Windows\jq.exe '{stars:.stargazers_count, forks:.forks_count, lang:.language}'

# 提取 TechIntel data.json 关键字段
Get-Content TechIntel\data.json | C:\Windows\jq.exe '.[] | select(.stars > 1000) | .name'

# 格式化输出
cat raw.json | C:\Windows\jq.exe '.'
```

## 在 OpenClaw 中的集成

通过 `exec` 工具调用 jq，典型场景：
```
1. 解析外部 API 的 JSON 响应
2. 过滤/投影数据用于报告
3. 格式化 JSON 配置
4. 提取 AI 输出的结构化数据
```

## AI 时代价值
- LLM 输出本质是 JSON，数据预处理的瑞士军刀
- 零启动时间，无需写 Python 脚本
- 轻量（~10MB 静态二进制）
- 生态：yq（YAML版）、jaq（Rust版）并行发展

## 数据来源
https://github.com/jqlang/jq

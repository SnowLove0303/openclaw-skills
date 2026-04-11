# OpenClaw 控制 Windows 系统与应用能力全景图

> **整理时间**: 2026-04-11
> **适用场景**: Windows 原生 / WSL2 内 Linux 两种部署模式

---

## 一、能力总览

OpenClaw 对 Windows 的控制能力分为**三层**：

| 层级 | 能力范围 | 核心工具 |
|------|---------|---------|
| **系统层** | 执行命令、安装程序、管理进程 | `exec` / `process` |
| **应用层** | 启动/关闭应用、操作 UI、读写文件 | `exec` + 系统命令 |
| **浏览器层** | 自动化浏览器、截图、点击、填表 | `browser` |

---

## 二、系统层控制

### 2.1 Shell 命令执行 (`exec`)

**这是最核心的能力** —— 在 Windows 上默认使用 **PowerShell** 执行任意命令。

```json
{
  "tool": "exec",
  "command": "Get-Process | Where-Object {$_.CPU -gt 100} | Select-Object Name, Id",
  "host": "gateway"   // 直接在宿主机执行
}
```

**支持的 shell**：
- PowerShell 7 (`pwsh`) — 默认首选
- Windows PowerShell 5.1 (`powershell`) — 降级备选
- CMD — 通过 `cmd /c` 包装

**常见 Windows 控制命令**：

```powershell
# 进程管理
Get-Process                    # 列出所有进程
Stop-Process -Name "notepad"   # 关闭进程
Start-Process "notepad.exe"   # 启动程序
Start-Process "msedge.exe" "https://example.com"  # 带URL启动

# 文件操作
Get-ChildItem "C:\\Users"      # 列出目录
Copy-Item "a.txt" "b.txt"     # 复制文件
Remove-Item "temp\\*" -Recurse # 删除目录

# 系统信息
systeminfo                     # 系统信息
hostname                       # 主机名
tasklist                       # 进程列表

# 网络
netstat -ano                   # 网络连接
ping 8.8.8.8                  # 连通性测试
curl https://example.com        # HTTP 请求

# 服务管理
Get-Service                   # 列出服务
Start-Service "Spooler"        # 启动服务
Stop-Service "Spooler"         # 停止服务
```

**配置示例** (`~/.openclaw/openclaw.json`)：

```json5
{
  tools: {
    exec: {
      // 默认在 gateway 宿主机执行
      host: "gateway",
      // 安全模式（建议开启）
      security: "allowlist",
      ask: "on-miss"
    }
  }
}
```

### 2.2 沙箱隔离 (`sandbox`)

OpenClaw 支持 Docker 沙箱隔离，但 **Windows 原生不支持 Docker 沙箱**（Docker Desktop 运行的是 Linux 容器）。

| 部署模式 | 沙箱支持 | 说明 |
|---------|---------|------|
| WSL2 内 | ✅ Docker | `backend: "docker"`，完整隔离 |
| Windows 原生 | ⚠️ 限制 | `exec` 直接在宿主机运行，无容器隔离 |

**建议**：Windows 上使用 WSL2 部署以获得完整沙箱能力。

---

## 三、应用层控制

### 3.1 启动与关闭应用

```powershell
# 启动任意程序
Start-Process "C:\Program Files\Notepad++\notepad++.exe"

# 启动带参数
Start-Process "msedge.exe" "-inprivate https://google.com"

# 关闭特定进程
Stop-Process -Name "notepad" -Force

# 通过窗口标题关闭（强制终止）
taskkill /F /FI "WINDOWTITLE eq 无标题*"
```

### 3.2 UIAutomation（需要 PowerShell 模块）

```powershell
# 模拟点击按钮（需要 Windows UIAutomation 模块）
Add-Type -AssemblyName System.Windows.Forms

# 获取窗口句柄
$wnd = Get-Process | Where-Object {$_.MainWindowTitle -match "Calculator"} | Select-Object -First 1

# 发送按键
[System.Windows.Forms.SendKeys]::SendWait("^{a}")  # Ctrl+A
```

> ⚠️ **注意**：纯 PowerShell UIAutomation 需要加载 .NET 程序集，OpenClaw 的 `exec` 工具可以直接运行这些命令。

### 3.3 文件关联打开

```powershell
# 用默认程序打开文件
Start-Process "C:\Users\admin\report.pdf"
# → 自动调用默认 PDF 阅读器

# 用默认程序打开 URL
Start-Process "https://github.com"
```

---

## 四、浏览器控制（核心能力）

### 4.1 架构概述

OpenClaw 的浏览器控制基于 **CDP (Chrome DevTools Protocol)**，通过 Playwright 封装，提供高级自动化能力。

```
┌─────────────────────────────────────────────────────┐
│  OpenClaw Agent                                     │
│                                                     │
│  browser tool (agent 调用)                          │
│       │                                             │
│       ▼                                             │
│  browser service (Gateway 内置)                      │
│       │                                             │
│       ▼                                             │
│  Playwright (CDP 封装层)                            │
│       │                                             │
│       ▼                                             │
│  Chromium/CDP (Chrome/Brave/Edge/Chromium)         │
│       ├── 本地独立 profile (openclaw)                │
│       ├── 远程 CDP (WSL2→Windows Chrome)            │
│       └── 已登录会话 (Chrome MCP / user profile)    │
└─────────────────────────────────────────────────────┘
```

### 4.2 部署模式

#### 模式 A：本地独立浏览器（推荐）

OpenClaw 启动专用的 Chrome profile，与用户日常浏览器完全隔离。

```bash
# CLI 操作
openclaw browser status
openclaw browser start
openclaw browser open https://example.com
openclaw browser snapshot
openclaw browser screenshot
```

**配置文件**：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "openclaw",  // 独立 profile
    headless: false,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    profiles: {
      openclaw: {
        cdpPort: 18800,
        color: "#FF4500"
      }
    }
  }
}
```

#### 模式 B：WSL2 Gateway → Windows Chrome（跨系统）

适用于 OpenClaw 在 WSL2 内运行，Chrome 在 Windows 上。

```powershell
# Windows 侧：启动带远程调试的 Chrome
chrome.exe --remote-debugging-port=9222
```

```json5
// WSL2 侧配置
{
  browser: {
    enabled: true,
    defaultProfile: "windows-chrome",
    profiles: {
      windows-chrome: {
        cdpUrl: "http://WINDOWS_HOST_IP:9222",
        attachOnly: true,
        color: "#00AA00"
      }
    }
  }
}
```

```bash
# WSL2 验证连通性
curl http://WINDOWS_HOST_IP:9222/json/version
```

#### 模式 C：附加到已登录的 Chrome 会话

复用用户 Chrome 中已登录的网站会话（需要 Chrome 开启远程调试）。

```json5
{
  browser: {
    defaultProfile: "user",
    profiles: {
      user: {
        driver: "existing-session",  // Chrome DevTools MCP
        attachOnly: true,
        color: "#00AA00"
      }
    }
  }
}
```

> ⚠️ `existing-session` 只能在**同主机**使用，不能跨 WSL2/Windows。

#### 模式 D：云端浏览器

```json5
{
  browser: {
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<KEY>",
        color: "#00AA00"
      }
    }
  }
}
```

### 4.3 Agent 浏览器工具能力矩阵

| 能力 | 独立 Profile | Existing-Session | 说明 |
|------|------------|-----------------|------|
| **导航** `navigate` | ✅ | ✅ | 打开 URL |
| **快照** `snapshot` | ✅ AI/ARIA | ✅ ARIA only | 页面结构分析 |
| **截图** `screenshot` | ✅ 全页/元素 | ✅ 部分支持 | 像素级截图 |
| **点击** `click` | ✅ ref/selector | ⚠️ ref only | 交互操作 |
| **输入** `type/fill` | ✅ | ⚠️ 限制 | 文本输入 |
| **悬停** `hover` | ✅ | ⚠️ ref only | 鼠标悬停 |
| **滚动** `scrollIntoView` | ✅ | ✅ | 滚动到元素 |
| **拖拽** `drag` | ✅ | ⚠️ | 拖拽操作 |
| **选择** `select` | ✅ | ⚠️ 单值 | 下拉选择 |
| **等待** `wait` | ✅ | ✅ | 条件等待 |
| **PDF导出** `pdf` | ✅ | ❌ | 页面转 PDF |
| **下载** `download` | ✅ | ❌ | 文件下载 |
| **JS执行** `evaluate` | ✅ | ⚠️ | 页面 JS |

### 4.4 浏览器控制命令参考

```bash
# === 基础操作 ===
openclaw browser open https://example.com
openclaw browser tabs
openclaw browser tab new
openclaw browser tab close 2
openclaw browser navigate https://example.com

# === 快照与截图 ===
openclaw browser snapshot --interactive   # 交互式快照（含 ref）
openclaw browser snapshot --format ai     # AI 快照（默认）
openclaw browser snapshot --labels         # 快照 + 截图叠加标签
openclaw browser screenshot --full-page   # 全页截图
openclaw browser screenshot --ref 12      # 元素截图

# === 页面交互 ===
openclaw browser click e12 --double      # 双击 ref=e12
openclaw browser type e23 "hello"         # 输入文本
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser press Enter
openclaw browser hover e44
openclaw browser scrollintoview e12
openclaw browser select 9 OptionA OptionB

# === 等待条件 ===
openclaw browser wait --text "Done"
openclaw browser wait --url "**/dash"
openclaw browser wait --load networkidle
openclaw browser wait --fn "window.ready===true"
openclaw browser wait "#main" --url "**/dash" --timeout-ms 15000

# === 状态与环境 ===
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
openclaw browser resize 1280 720

# === 高级功能 ===
openclaw browser pdf
openclaw browser download e12 report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser dialog --accept
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12

# === 调试 ===
openclaw browser console --level error
openclaw browser errors
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop
openclaw browser responsebody "**/api" --max-chars 5000
```

### 4.5 SSRF 安全策略

浏览器导航受 SSRF 保护，可配置允许/禁止访问的范围：

```json5
{
  browser: {
    ssrfPolicy: {
      // 默认：允许私有网络（受信任网络）
      dangerouslyAllowPrivateNetwork: true,
      
      // 严格模式：只允许公网
      // dangerouslyAllowPrivateNetwork: false,
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    }
  }
}
```

---

## 五、WebApp 测试集成

通过 `webapp-testing` skill，OpenClaw 可以用 Playwright 原生脚本测试 Windows 本地 Web 应用。

**典型工作流**：

```
用户请求 → OpenClaw 分析需求
    ↓
有 skill → 加载 SKILL.md，按指南执行
    ↓
无 skill → 直接 exec 运行 Python Playwright 脚本
    ↓
服务器未运行 → 用 with_server.py 启动
    ↓
执行自动化 → 截图 / DOM 检查 / 操作
```

**with_server.py** 用法示例：

```bash
# 启动本地开发服务器 + 运行 Playwright 测试
python scripts/with_server.py \
  --server "npm run dev" --port 5173 \
  -- python your_automation.py
```

**Playwright 脚本示例**：

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # 关键：等待 JS 执行
    page.screenshot(path='/tmp/inspect.png', full_page=True)
    page.locator('button').click()
    browser.close()
```

---

## 六、Windows 原生 vs WSL2 部署对比

| 能力 | Windows 原生 | WSL2 |
|------|------------|------|
| `exec` / `process` | ✅ PowerShell | ✅ bash/shell |
| Docker 沙箱 | ❌ | ✅ |
| 本地浏览器控制 | ✅ Chrome/Brave/Edge | ✅ + 跨系统 |
| 独立 Browser Profile | ✅ | ✅ |
| Existing-Session (Chrome MCP) | ✅ 同主机 | ⚠️ 仅同主机 |
| 远程 CDP (跨系统) | N/A | ✅ |
| Gateway 安装为服务 | ⚠️ Scheduled Task / Startup | ✅ systemd |
| 云端浏览器 | ✅ | ✅ |
| 自动启动 | ⚠️ Startup 文件夹 | ✅ systemd |
| 定时任务 (cron) | ✅ | ✅ |

---

## 七、权限与安全模型

### 7.1 执行权限分层

```
exec 调用流程：
1. tool policy 检查 (tools.allow/deny)
2. sandbox 检查 (是否在沙箱内)
3. elevated 检查 (是否需要逃逸到宿主机)
4. host routing (gateway / node / sandbox)
5. 审批流 (ask=on-miss / allowlist 模式)
```

### 7.2 Elevated 模式

当 Agent 在沙箱内运行时，`elevated` 允许它逃逸到宿主机执行：

```
/elevated on    → 逃逸 + 保留审批
/elevated full  → 逃逸 + 跳过审批
/elevated off   → 返回沙箱内执行
```

配置示例：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        feishu: ["ou_eab44f1e950109efa9ca66a36b8d4b9a"]
      }
    }
  }
}
```

### 7.3 Tool Policy 限制

```json5
{
  tools: {
    // 只允许这些工具
    allow: ["exec", "browser", "read", "web_search"],
    deny: ["write", "edit"]
  }
}
```

---

## 八、快捷命令速查

```bash
# === 浏览器 ===
openclaw browser start                    # 启动浏览器
openclaw browser status                   # 查看状态
openclaw browser tabs                     # 列出标签页
openclaw browser open <url>               # 打开网页
openclaw browser snapshot                # 获取页面快照
openclaw browser screenshot              # 截图
openclaw browser screenshot --full-page  # 全页截图

# === Gateway ===
openclaw gateway status                   # 查看状态
openclaw gateway restart                 # 重启
openclaw doctor                          # 诊断问题

# === 节点 ===
openclaw nodes list                      # 列出配对设备

# === Cron ===
openclaw cron list                       # 查看定时任务
openclaw cron run <job-id>              # 手动触发
```

---

## 九、已知限制

| 限制 | 说明 | 规避方案 |
|------|------|---------|
| Windows 无 Docker 沙箱 | 原生 Windows 无法运行容器沙箱 | 使用 WSL2 部署 |
| UIAutomation 限制 | 无法直接操作第三方应用 UI | 用 `exec` + PowerShell 脚本 |
| Existing-session 跨主机 | Chrome MCP 仅限同主机 | 使用远程 CDP profile |
| 浏览器防检测 | 自动化可能触发反爬 | 优先用 host 浏览器而非沙箱 |
| PowerShell 输出编码 | 中文可能乱码 | 设置 `$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()` |

---

## 十、推荐配置模板

### Windows 原生部署（轻量）

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "openclaw",
    headless: false
  },
  tools: {
    exec: {
      host: "gateway",
      security: "allowlist",
      ask: "on-miss"
    }
  }
}
```

### WSL2 部署（完整功能）

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "openclaw",
    headless: false,
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      windows: {
        cdpUrl: "http://WINDOWS_HOST_IP:9222",
        attachOnly: true,
        color: "#00AA00"
      }
    }
  },
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        backend: "docker",
        workspaceAccess: "rw"
      }
    }
  },
  tools: {
    exec: {
      host: "gateway",
      security: "allowlist",
      ask: "on-miss"
    },
    elevated: {
      enabled: true,
      allowFrom: {
        feishu: ["ou_eab44f1e950109efa9ca66a36b8d4b9a"]
      }
    }
  }
}
```

---

*整理自 OpenClaw 官方文档 v2026.4.2*

@echo off
chcp 65001 >nul 2>&1
title Ollama 安装程序

echo.
echo  ==============================================
echo     本地大模型安装程序
echo     配置：RTX 3050 4GB + 16GB RAM
echo  ==============================================
echo.

:: 检查 Ollama 是否已安装
ollama --version >nul 2>&1
if %errorlevel%==0 (
    echo  [OK] Ollama 已安装
    goto :install_models
) else (
    echo  [ ] Ollama 未安装，正在下载安装程序...
)

:: 下载 Ollama Windows 版
echo.
echo  正在从官方下载 Ollama（请稍候，约 200MB）...
echo  下载完成后会弹出安装界面，请一路点击"下一步"完成安装
echo  安装完成后重启本程序继续
echo.

powershell -Command "Start-Process 'https://ollama.com/download/windows'"

echo.
set /p dummy=安装完成后按 Enter 继续...

:: 验证安装
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [错误] Ollama 安装失败，请手动安装后重试
    echo  下载地址：https://ollama.com/download
    pause
    exit /b 1
)

echo  [OK] Ollama 安装成功

:install_models
:: 配置模型存储位置
echo.
echo  [ ] 配置模型存储位置到 F:\AI本地部署大模型\models
setx OLLAMA_MODELS "F:\AI本地部署大模型\models" /M >nul 2>&1
echo  [OK] 已配置（重启终端后生效）

:: 下载模型
echo.
echo  是否立即下载模型？
echo  [1] 下载全部两个模型（约 2.5 GB）
echo  [2] 先跳过，稍后手动下载
echo  [3] 只下载 Gemma 4
echo  [4] 只下载 Qwen 3.5
echo.
set /p m=请输入 [1-4]:

if "%m%"=="1" goto dl_all
if "%m%"=="2" goto end
if "%m%"=="3" goto dl_gemma
if "%m%"=="4" goto dl_qwen
goto end

:dl_all
echo.
echo  开始下载 Gemma 4 ...
ollama pull gemma4
echo.
echo  开始下载 Qwen 3.5:1.5B ...
ollama pull qwen3.5:1.5b
goto end_download

:dl_gemma
echo.
ollama pull gemma4
goto end_download

:dl_qwen
echo.
ollama pull qwen3.5:1.5b
goto end_download

:end_download
echo.
echo  模型下载完成！

:end
echo.
echo  ==============================================
echo     安装完成！
echo  ==============================================
echo.
echo  启动方式：
echo  1. 右键点击"启动器.bat" -> 以管理员身份运行
echo  2. 输入数字选择要运行的模型
echo.
echo  提示：首次运行建议先从菜单选 [3]->[3] 下载全部模型
echo.
pause

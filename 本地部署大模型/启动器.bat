@echo off
chcp 65001 >nul 2>&1
title 本地大模型 - 快速切换
color 0A

:main
cls
echo.
echo  ============================================
echo    本地大模型 - 快速切换启动器
echo  ============================================
echo.
echo  [1] Gemma 4   (Google, 英文/多语言, 15-20 tok/s)
echo  [2] Qwen 3.5  (阿里,   中文最强,  30-45 tok/s)
echo  [3] 下载管理   (拉取/删除模型)
echo  [4] 查看状态   (已安装模型)
echo  [5] 退出
echo.
set /p choice=请输入数字 [1-5]:

if "%choice%"=="1" goto gemma
if "%choice%"=="2" goto qwen
if "%choice%"=="3" goto download
if "%choice%"=="4" goto status
if "%choice%"=="5" exit

:gemma
cls
echo.
echo  正在启动 Gemma 4 ...
echo  退出对话后输入 exit 返回本菜单
echo.
ollama run gemma4
echo.
echo  已退出 Gemma 4，按任意键返回菜单...
pause >nul
goto main

:qwen
cls
echo.
echo  正在启动 Qwen 3.5 ...
echo  退出对话后输入 exit 返回本菜单
echo.
ollama run qwen3.5:1.5b
echo.
echo  已退出 Qwen 3.5，按任意键返回菜单...
pause >nul
goto main

:download
cls
echo.
echo  ===== 下载管理 =====
echo.
echo  [1] 拉取 Gemma 4        (约 1.5 GB)
echo  [2] 拉取 Qwen 3.5 1.5B  (约 1 GB)
echo  [3] 拉取全部两个模型
echo  [4] 删除 Gemma 4
echo  [5] 删除 Qwen 3.5
echo  [6] 返回菜单
echo.
set /p dl=请输入数字 [1-6]:

if "%dl%"=="1" goto pull_gemma
if "%dl%"=="2" goto pull_qwen
if "%dl%"=="3" goto pull_all
if "%dl%"=="4" goto rm_gemma
if "%dl%"=="5" goto rm_qwen
if "%dl%"=="6" goto main
goto download

:pull_gemma
cls
echo.
echo  正在拉取 Gemma 4，请耐心等待...
echo.
ollama pull gemma4
echo.
echo  完成！按任意键返回...
pause >nul
goto download

:pull_qwen
cls
echo.
echo  正在拉取 Qwen 3.5:1.5B，请耐心等待...
echo.
ollama pull qwen3.5:1.5b
echo.
echo  完成！按任意键返回...
pause >nul
goto download

:pull_all
cls
echo.
echo  正在拉取全部两个模型（约 2.5 GB）...
echo.
echo === 拉取 Gemma 4 ===
ollama pull gemma4
echo.
echo === 拉取 Qwen 3.5 ===
ollama pull qwen3.5:1.5b
echo.
echo  全部完成！按任意键返回...
pause >nul
goto main

:rm_gemma
ollama rm gemma4 2>nul
echo  Gemma 4 已删除
pause
goto download

:rm_qwen
ollama rm qwen3.5:1.5b 2>nul
echo  Qwen 3.5:1.5B 已删除
pause
goto download

:status
cls
echo.
echo  ===== 模型状态 =====
echo.
echo --- 已安装的模型 ---
ollama list
echo.
pause
goto main

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import time
from urllib.parse import quote
from datetime import datetime

# ==================== 配置 ====================
TODAY = datetime.now().strftime("%Y-%m-%d")  # 改成英文格式日期，减少分词干扰
DEFAULT_MAX = 10
DEFAULT_FULL = 0
TIMEOUT = 15000

# 强制UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

_browser = None
_playwright = None


# ==================== 启动浏览器（新增中文环境） ====================
def init():
    global _browser, _playwright
    if _browser: return True
    try:
        from playwright.sync_api import sync_playwright
        print("[DEBUG] 启动浏览器（中文环境）", file=sys.stderr)
        _playwright = sync_playwright().start()
        _browser = _playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu"]
        )
        return True
    except Exception as e:
        print(f"[ERROR] 启动失败: {e}", file=sys.stderr)
        print("[SOLVE] 运行: pip install playwright && playwright install chromium", file=sys.stderr)
        return False


def close():
    try:
        if _browser: _browser.close()
        if _playwright: _playwright.stop()
    except:
        pass


# ==================== 必应搜索（修复中文参数） ====================
def search(query):
    start = time.time()

    # 1. 构建搜索URL（核心修复：加中文地区/语言参数）
    base_url = "https://www.bing.com/search"
    params = {
        "q": query,
        "mkt": "zh-CN",  # 市场：中国
        "setlang": "zh-CN",  # 语言：中文
        "cc": "CN",  # 国家：中国
        "count": str(DEFAULT_MAX + 2)
    }
    # 拼接参数
    url = base_url + "?" + "&".join([f"{k}={quote(v)}" for k, v in params.items()])

    print(f"[DEBUG] 搜索词: {query}", file=sys.stderr)
    print(f"[DEBUG] URL: {url}", file=sys.stderr)

    if not init():
        return []

    results = []
    try:
        # 2. 新建上下文（核心修复：设置中文Locale和UA）
        ctx = _browser.new_context(
            locale="zh-CN",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = ctx.new_page()

        # 拦截无用资源
        page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,mp4}", lambda r: r.abort())

        # 访问页面
        page.goto(url, timeout=TIMEOUT, wait_until="domcontentloaded")
        # 稍微等一下，让Bing加载中文结果
        page.wait_for_timeout(1000)

        # 3. 用JS直接提取结果（最稳健）
        raw_results = page.evaluate("""() => {
            const items = [];
            document.querySelectorAll('li.b_algo').forEach((el, idx) => {
                try {
                    const a = el.querySelector('h2 a');
                    const p = el.querySelector('.b_caption p');
                    if(a && a.href) {
                        items.push({
                            title: a.innerText || a.textContent || '',
                            url: a.href,
                            snippet: p ? (p.innerText || p.textContent || '') : ''
                        });
                    }
                } catch(e) {}
            });
            return items;
        }""")

        # 清洗结果
        for r in raw_results:
            if r["title"] and r["url"] and len(r["title"]) > 3:
                results.append({
                    "title": r["title"].strip(),
                    "url": r["url"].strip(),
                    "snippet": r["snippet"].strip(),
                    "content": ""
                })

        ctx.close()
    except Exception as e:
        print(f"[ERROR] 搜索失败: {e}", file=sys.stderr)

    print(f"[DEBUG] 结果数: {len(results)} | 耗时: {round(time.time() - start, 2)}s", file=sys.stderr)
    return results[:DEFAULT_MAX]


# ==================== 抓取全文 ====================
def fetch(url):
    start = time.time()
    print(f"[DEBUG] 抓取: {url}", file=sys.stderr)
    try:
        ctx = _browser.new_context(locale="zh-CN")
        page = ctx.new_page()
        page.route("**/*.{png,jpg,css,woff}", lambda r: r.abort())
        page.goto(url, timeout=TIMEOUT, wait_until="domcontentloaded")

        # JS提取正文
        text = page.evaluate("""()=>{
            document.querySelectorAll('script,style,nav,header,footer,.ad,.ads').forEach(e=>e.remove());
            const main = document.querySelector('article,main,.content,.post,.article') || document.body;
            return main ? main.innerText : '';
        }""")

        ctx.close()
        res = text.strip()[:5000] if text else ""
        print(f"[DEBUG] 抓取成功 | 耗时 {round(time.time() - start, 2)}s", file=sys.stderr)
        return res
    except Exception as e:
        print(f"[ERROR] 抓取失败: {e}", file=sys.stderr)
        return "抓取失败"


# ==================== 主函数 ====================
def main():
    query = " ".join([a for a in sys.argv[1:] if not a.startswith("--")])
    full = DEFAULT_FULL
    for a in sys.argv[1:]:
        if a.startswith("--full="):
            full = int(a.split("=")[1])

    if not query:
        print(json.dumps({"error": "no query"}))
        return

    data = search(query)

    if full > 0 and data:
        take = min(full, len(data))
        for i in range(take):
            data[i]["content"] = fetch(data[i]["url"])

    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    finally:
        close()
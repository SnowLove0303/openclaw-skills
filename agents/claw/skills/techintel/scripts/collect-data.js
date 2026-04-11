/**
 * TechIntel 数据收集器
 * 用法: node collect-data.js [YYYY-MM-DD]
 * 输出: F:\AI\Openclaw\workspace\TechIntel\data.json
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE_DATA = 'F:\\AI\\Openclaw\\workspace\\TechIntel\\data.json';
const HTTP_TIMEOUT = 12000;
const RESULTS_PER_SEARCH = 8;
const FETCH_COUNT = 4;

function loadCredentials() {
    const p = path.join(os.homedir(), '.openclaw', 'credentials', 'search.json');
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

function httpGet(url, timeout = HTTP_TIMEOUT) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const req = https.request({
                hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
                    return void resolve(httpGet(res.headers.location, timeout));
                let body = ''; res.on('data', c => body += c);
                res.on('end', () => resolve(body));
            });
            req.on('error', reject);
            req.setTimeout(timeout, () => { try { req.destroy(); } catch (_) {} reject(new Error('timeout')); });
            req.end();
        } catch (e) { reject(e); }
    });
}

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/https?:\/\/[^\s]+/g, ' ')
        .replace(/[\r\n]{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

function tavilySearch(query, apiKey, num) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ api_key: apiKey, query, max_results: num, search_depth: 'advanced', include_answer: true });
        const req = https.request({
            hostname: 'api.tavily.com', path: '/search', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = ''; res.on('data', c => body += c);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(HTTP_TIMEOUT, () => { try { req.destroy(); } catch (_) {} reject(new Error('timeout')); });
        req.write(data); req.end();
    });
}

const BLOCKED = new Set(['github.com', 'github.io', 'github.dev', 'twitter.com', 'x.com', 'youtube.com', 'youtu.be']);

async function fetchItem(r) {
    try {
        const u = new URL(r.url);
        if (!BLOCKED.has(u.hostname.toLowerCase())) {
            const raw = await httpGet(r.url, 10000);
            const cleaned = stripHtml(raw);
            if (cleaned.length > 100) return { title: r.title, url: r.url, content: cleaned.substring(0, 1200) };
        }
    } catch (_) {}
    return { title: r.title, url: r.url, content: (r.content || '').substring(0, 600) };
}

async function main() {
    const args = process.argv.slice(2);
    const now = new Date();
    const dateStr = args[0] && /^\d{4}-\d{2}-\d{2}$/.test(args[0]) ? args[0] : now.toISOString().split('T')[0];
    const hour = String(now.getHours()).padStart(2, '0');

    console.log(`[TechIntel] 收集数据: ${dateStr}`);

    const creds = loadCredentials();
    const key = creds.tavily;
    if (!key) { console.error('[TechIntel] ❌ 无 Tavily API Key'); process.exit(1); }

    const day = dateStr.split('-')[2]; // 05
    const monthDay = `${dateStr.split('-')[1]}/${day}`; // 04/05
    const queries = [
        { section: 'github_trending', query: `github trending repositories ${monthDay} 2026` },
        { section: 'oss_ai', query: `open source AI agent framework ${monthDay} 2026 github stars` },
        { section: 'oss_community', query: `open source AI community ${monthDay} 2026 Discord HuggingFace GitHub` },
        { section: 'openclaw', query: `OpenClaw Claude Code AI ${monthDay} 2026 release update` },
        { section: 'coding_agent', query: `claude code open source alternative ${monthDay} 2026 github` },
        { section: 'industry', query: `OpenAI Anthropic Google AI ${monthDay} 2026 breakthrough launch` }
    ];

    const data = { date: dateStr, hour, generated: new Date().toISOString(), sections: {} };

    for (const q of queries) {
        try {
            const result = await tavilySearch(q.query, key, RESULTS_PER_SEARCH);
            const items = result.results || [];
            const detailed = [];
            for (const r of items.slice(0, FETCH_COUNT)) {
                detailed.push(await fetchItem(r));
                await new Promise(r => setTimeout(r, 200));
            }
            data.sections[q.section] = { items: detailed, answer: result.answer || '' };
            console.log(`[TechIntel] ✅ ${q.section}: ${detailed.length} 条`);
        } catch (e) {
            console.error(`[TechIntel] ❌ ${q.section}: ${e.message}`);
            data.sections[q.section] = { items: [], answer: '' };
        }
    }

    const outDir = path.dirname(WORKSPACE_DATA);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    try { fs.writeFileSync(WORKSPACE_DATA, JSON.stringify(data, null, 2), 'utf-8'); } catch(e) { console.error('[TechIntel] ❌ 写入失败:', e.message); }
    process.exit(0);
    console.log(`[TechIntel] ✅ 数据已保存: ${WORKSPACE_DATA}`);
    const total = Object.values(data.sections).reduce((a, s) => a + (s.items || []).length, 0);
    console.log(`[TechIntel] 共 ${total} 条数据`);
}

main().catch(e => { console.error('[TechIntel] Fatal:', e.message); process.exit(1); });

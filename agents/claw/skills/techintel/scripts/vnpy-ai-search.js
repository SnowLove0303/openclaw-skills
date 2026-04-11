/**
 * 搜索 vnpy + AI + openclaw/claude/copaw 相关项目
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HTTP_TIMEOUT = 12000;

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

async function ghSearch(query, token) {
    const encoded = encodeURIComponent(query);
    const url = `https://api.github.com/search/repositories?q=${encoded}&per_page=20&sort=updated`;
    const raw = await httpGet(url, 10000);
    try {
        const data = JSON.parse(raw);
        return data.items || [];
    } catch (e) {
        return [];
    }
}

async function main() {
    const creds = loadCredentials();
    const key = creds.tavily;
    if (!key) { console.error('❌ 无 Tavily API Key'); process.exit(1); }

    const queries = [
        { name: 'vnpy + openclaw', q: 'vnpy openclaw site:github.com' },
        { name: 'vnpy + claude', q: 'vnpy claude AI site:github.com' },
        { name: 'vnpy + copaw', q: 'vnpy copaw site:github.com' },
        { name: 'vnpy + AI量化 + openclaw', q: 'vnpy AI 量化 openclaw claude' },
        { name: 'vnpy + Claude AI trading', q: 'vnpy Claude AI trading quantitative' },
    ];

    let allProjects = [];
    let notes = [];

    for (const q of queries) {
        console.log(`🔍 搜索: ${q.name}`);
        try {
            const result = await tavilySearch(q.q, key, 10);
            const items = result.results || [];
            console.log(`  → ${items.length} 条结果`);
            for (const item of items) {
                const url = item.url || '';
                if (url.includes('github.com') && !notes.find(n => n.url === url)) {
                    notes.push({ name: q.name, ...item });
                }
            }
        } catch (e) {
            console.error(`  ❌ ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    // 也用 GitHub API 直接搜
    console.log('\n🔍 GitHub API 直接搜索...');
    const ghQueries = [
        'vnpy openclaw',
        'vnpy claude',
        'vnpy copaw',
        'vnpy AI quantitative',
    ];
    for (const q of ghQueries) {
        try {
            const repos = await ghSearch(q, creds.github);
            console.log(`  ${q}: ${repos.length} 个仓库`);
            for (const repo of repos) {
                if (!allProjects.find(p => p.full_name === repo.full_name)) {
                    allProjects.push(repo);
                }
            }
        } catch (e) {
            console.log(`  ❌ ${q}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n找到 ${allProjects.length} 个 GitHub 项目`);
    console.log(`Tavily 发现 ${notes.length} 个相关链接`);

    // 输出合并结果
    const results = { projects: allProjects, tavilyNotes: notes, searchedAt: new Date().toISOString() };
    console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

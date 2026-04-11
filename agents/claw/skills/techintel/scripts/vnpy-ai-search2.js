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

async function ghSearch(query) {
    const encoded = encodeURIComponent(query);
    const url = `https://api.github.com/search/repositories?q=${encoded}&per_page=20&sort=stars&order=desc`;
    const raw = await httpGet(url, 15000);
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
        'vnpy AI 智能量化 github',
        'vnpy openai claude github 项目',
        'vnpy LLM 大模型 量化 github',
        'vnpy copilot github 插件',
        'vnpy AI assistant 自动交易 github',
    ];

    let allRepos = [];

    for (const q of queries) {
        console.log(`🔍 Tavily: ${q}`);
        try {
            const result = await tavilySearch(q, key, 10);
            const items = result.results || [];
            console.log(`  → ${items.length} 条结果`);
            for (const item of items) {
                if (item.url && item.url.includes('github.com') && !allRepos.find(r => r.url === item.url)) {
                    allRepos.push({ url: item.url, title: item.title, content: (item.content || '').substring(0, 300) });
                }
            }
        } catch (e) {
            console.error(`  ❌ ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 800));
    }

    // GitHub API search
    console.log('\n🔍 GitHub API...');
    const ghQueries = [
        'vnpy AI in:readme',
        'vnpy openai in:readme',
        'vnpy claude in:readme',
        'vnpy copilot in:readme',
        'vnpy LLM in:readme',
        'vnpy chatbot in:readme',
        'vnpy AI agent in:readme',
    ];

    for (const q of ghQueries) {
        try {
            const repos = await ghSearch(q);
            console.log(`  ${q}: ${repos.length} 个`);
            for (const repo of repos) {
                if (!allRepos.find(r => r.full_name === repo.full_name)) {
                    allRepos.push({
                        full_name: repo.full_name,
                        url: repo.html_url,
                        description: repo.description,
                        stars: repo.stargazers_count,
                        language: repo.language,
                        updated: repo.updated_at,
                    });
                }
            }
        } catch (e) {
            console.log(`  ❌ ${q}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n共找到 ${allRepos.length} 个相关仓库/链接`);
    console.log(JSON.stringify(allRepos, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

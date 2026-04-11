const https = require('https');
const fs = require('fs');
const os = require('os');

const HTTP_TIMEOUT = 12000;

function loadCredentials() {
    const p = path.join(os.homedir(), '.openclaw', 'credentials', 'search.json');
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

function httpGet(url, timeout) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const req = https.request({
                hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json' }
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
                    return void resolve(httpGet(res.headers.location, timeout));
                let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b, url }));
            });
            req.on('error', reject);
            req.setTimeout(timeout || HTTP_TIMEOUT, () => { try { req.destroy(); } catch (_) { } reject(new Error('timeout')); });
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

const BLOCKED = new Set(['github.com', 'twitter.com', 'x.com', 'youtube.com', 'youtu.be']);

(async () => {
    // GitHub issues to check
    const issueUrls = [
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/26455', title: 'network proxy not work' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/26207', title: 'setGlobalDispatcher breaks HTTP proxy' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/43821', title: 'global HTTP proxy support' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/30368', title: 'per-provider HTTP proxy' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/28524', title: 'Telegram ignores proxy' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/2102', title: 'HTTP_PROXY ignored' },
        { url: 'https://api.github.com/repos/openclaw/openclaw/issues/28788', title: 'Discord REST API ignores proxy' },
        { url: 'https://api.github.com/repos/anomalyco/opencode/issues/10694', title: 'Bad Gateway proxy' },
        { url: 'https://api.github.com/repos/anomalyco/opencode/issues/4823', title: 'proxy env vars ignored' },
        { url: 'https://api.github.com/repos/anomalyco/opencode/issues/10227', title: 'add proxy support' },
    ];

    let results = [];

    for (const item of issueUrls) {
        try {
            const r = await httpGet(item.url, 8000);
            if (r.status === 200) {
                const issue = JSON.parse(r.body);
                const body = stripHtml(issue.body || '').substring(0, 800);
                const labels = issue.labels ? issue.labels.map(l => l.name).join(', ') : '';
                results.push({
                    repo: item.url.includes('openclaw') ? 'openclaw' : 'opencode',
                    num: issue.number,
                    title: issue.title,
                    state: issue.state,
                    labels,
                    url: issue.html_url,
                    body
                });
                console.log(`[${item.url.includes('openclaw') ? 'OW' : 'OC'}] #${issue.number} [${issue.state}] ${issue.title} | Labels: ${labels}`);
            }
        } catch (e) {
            console.log(`ERR ${item.url}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Total issues:', results.length);
    console.log(JSON.stringify(results, null, 2));
})();

const https = require('https');
const fs = require('fs');

function httpGet(url, timeout = 12000) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname, path: u.pathname, method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        }, (res) => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', reject);
        req.setTimeout(timeout, () => { try { req.destroy(); } catch (_) { } reject(new Error('timeout')); });
        req.end();
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
        .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
        .replace(/[\r\n]{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

(async () => {
    // Search awesome-quant README for data source sections
    console.log('=== awesome-quant data sections ===');
    try {
        const r = await httpGet('https://raw.githubusercontent.com/wilsonfreitas/awesome-quant/main/README.md');
        const content = stripHtml(r.body);
        const lines = content.split('\n');
        let section = '';
        for (const line of lines) {
            if (line.match(/##\s.*data/i) || line.match(/##\s.*source/i) || line.match(/##\s.*realtime/i) || line.match(/##\s.*market/i) || line.match(/##\s.*api/i) || line.match(/##\s.*free/i)) {
                console.log('\n' + line);
            }
        }
    } catch (e) { console.log('ERR awesome-quant:', e.message); }

    // Check key repos
    console.log('\n=== Key repos ===');
    const repos = [
        { owner: 'vnpy', repo: 'vnpy_tushare' },
        { owner: 'vnpy', repo: 'vnpy_websocket' },
        { owner: 'vnpy', repo: 'vnpy_gm' },
        { owner: 'vnpy', repo: 'vnpy_tqsdk' },
        { owner: 'vnpy', repo: 'vnpy_xt' },
        { owner: 'waditu', repo: 'tushare' },
        { owner: 'akfamily', repo: 'akshare' },
        { owner: 'vnpy', repo: 'vnpy_rqdata' },
        { owner: 'vnpy', repo: 'vnpy_ifind' },
    ];

    for (const r of repos) {
        try {
            const apiUrl = `https://api.github.com/repos/${r.owner}/${r.repo}`;
            const resp = await httpGet(apiUrl);
            if (resp.status === 200) {
                const d = JSON.parse(resp.body);
                console.log(`${r.owner}/${r.repo} | Stars: ${d.stargazers_count} | Lang: ${d.language || 'N/A'} | ${d.description || ''}`);
            }
        } catch (e) { console.log(`ERR ${r.owner}/${r.repo}: ${e.message}`); }
        await new Promise(s => setTimeout(s, 400));
    }

    // Search GitHub API for vnpy free data
    console.log('\n=== GitHub API search ===');
    const queries = [
        'vnpy free market data websocket',
        'vnpy alternative data source github',
    ];
    for (const q of queries) {
        try {
            const encoded = encodeURIComponent(q);
            const r = await httpGet(`https://api.github.com/search/repositories?q=${encoded}&per_page=5&sort=stars&order=desc`);
            if (r.status === 200) {
                const d = JSON.parse(r.body);
                (d.items || []).forEach(item => {
                    console.log(`[${item.stargazers_count}⭐] ${item.full_name} - ${item.description || ''}`);
                });
            }
        } catch (e) { console.log(`ERR GH search: ${e.message}`); }
        await new Promise(s => setTimeout(s, 500));
    }
})();

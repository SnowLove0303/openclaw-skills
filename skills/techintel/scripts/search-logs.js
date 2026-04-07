/**
 * TechIntel 日志搜索工具
 * 用法: node search-logs.js [--hours 24] [--pattern "techintel|e4166ba9"]
 * 功能: 搜索 OpenClaw 日志中的 TechIntel 相关记录，带格式化输出和统计
 */
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const STORAGE_DIR = 'F:\\AI\\Openclaw\\workspace\\TechIntel';

// 命令行参数解析
const args = process.argv.slice(2);
let hours = 24;
let pattern = 'techintel|e4166ba9';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--hours' && args[i + 1]) hours = parseInt(args[++i]);
    if (args[i] === '--pattern' && args[i + 1]) pattern = args[++i];
    if (args[i] === '--help') { printHelp(); process.exit(0); }
}

// 颜色输出（ANSI）
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

function color(c, text) { return `${c}${text}${C.reset}`; }
function ts() { return new Date().toISOString().replace('T', ' ').substring(0, 19); }

// 图标映射
function getIcon(line) {
    if (/✅|success|completed/.test(line)) return '✅';
    if (/❌|fail|error|fatal/.test(line)) return '❌';
    if (/warn|warning/.test(line)) return '⚠️';
    if (/start|启动|开始/.test(line)) return '🚀';
    if (/收集|collect|数据/.test(line)) return '📡';
    if (/保存|save|写入/.test(line)) return '💾';
    if (/cron|定时/.test(line)) return '⏰';
    return '  ';
}

function getColor(line) {
    if (/❌|fail|error|fatal|exception/.test(line)) return C.red;
    if (/⚠️|warn/.test(line)) return C.yellow;
    if (/✅|success|completed|done/.test(line)) return C.green;
    return C.white;
}

// 从 OpenClaw 日志中提取 TechIntel 相关行
async function searchOpenClawLogs(pattern, hours) {
    const cutoff = Date.now() - hours * 3600 * 1000;
    const results = [];

    try {
        // 尝试从 OpenClaw 获取日志
        const output = execSync('openclaw logs', { timeout: 10000, encoding: 'utf-8', shell: true });

        const lines = output.split('\n').filter(l => l.trim());
        for (const line of lines) {
            // 匹配关键词
            if (!new RegExp(pattern, 'i').test(line)) continue;

            // 尝试提取时间戳
            let logTime = null;
            const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
            if (timeMatch) {
                logTime = new Date(timeMatch[1].replace(' ', 'T')).getTime();
                if (isNaN(logTime)) logTime = null;
            }

            if (logTime !== null && logTime < cutoff) continue;

            results.push({
                source: 'openclaw',
                icon: getIcon(line),
                color: getColor(line),
                line: line.trim()
            });
        }
    } catch (e) {
        // openclaw logs 不可用，尝试其他方式
    }

    return results;
}

// 搜索本地 data.json 的历史记录
function searchLocalData(pattern, hours) {
    const fs = require('fs');
    const path = require('path');
    const results = [];

    try {
        const dataPath = path.join(STORAGE_DIR, 'data.json');
        if (!fs.existsSync(dataPath)) return results;

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const reg = new RegExp(pattern, 'i');

        // 搜索 data.json 内容
        const jsonStr = JSON.stringify(data);
        if (reg.test(jsonStr)) {
            results.push({
                source: 'data.json',
                icon: '📊',
                color: C.cyan,
                line: `[data.json] TechIntel 数据收集: ${data.date} ${data.hour}:00，共 ${Object.values(data.sections).reduce((a, s) => a + (s.items || []).length, 0)} 条记录`
            });
        }
    } catch (e) {}

    return results;
}

// 搜索历史报告文件
function searchReportFiles(pattern, hours) {
    const fs = require('fs');
    const path = require('path');
    const results = [];

    try {
        const reportDir = STORAGE_DIR;
        if (!fs.existsSync(reportDir)) return results;

        const files = fs.readdirSync(reportDir)
            .filter(f => f.endsWith('.md') && /^2026-\d{2}-\d{2}/.test(f))
            .sort()
            .reverse()
            .slice(0, 10);

        const cutoffDate = new Date(Date.now() - hours * 3600 * 1000);
        const reg = new RegExp(pattern, 'i');

        for (const file of files) {
            const filePath = path.join(reportDir, file);
            const stat = fs.statSync(filePath);
            if (stat.mtime < cutoffDate) continue;

            const content = fs.readFileSync(filePath, 'utf-8');
            if (reg.test(content)) {
                const matches = content.match(new RegExp(`.*${pattern}.*`, 'gi')) || [];
                for (const match of matches.slice(0, 3)) {
                    results.push({
                        source: file,
                        icon: '📄',
                        color: C.blue,
                        line: `[${file}] ${match.trim().substring(0, 120)}`
                    });
                }
            }
        }
    } catch (e) {}

    return results;
}

async function main() {
    console.log('');
    console.log(color(C.cyan, '  ━━━ TechIntel 日志搜索 ━━━'));
    console.log(color(C.gray, `  关键词: ${pattern}`));
    console.log(color(C.gray, `  时间范围: 最近 ${hours} 小时`));
    console.log('');

    const [openclawResults, localData, reportFiles] = await Promise.all([
        searchOpenClawLogs(pattern, hours),
        searchLocalData(pattern, hours),
        searchReportFiles(pattern, hours)
    ]);

    const allResults = [...openclawResults, ...localData, ...reportFiles];

    if (allResults.length === 0) {
        console.log(color(C.gray, '  未找到匹配的日志记录'));
        console.log('');
        return;
    }

    // 按来源分组输出
    const bySource = {};
    for (const r of allResults) {
        if (!bySource[r.source]) bySource[r.source] = [];
        bySource[r.source].push(r);
    }

    for (const [source, entries] of Object.entries(bySource)) {
        console.log(color(C.dim, `  ┄┄ ${source} ` + '─'.repeat(30)));
        for (const entry of entries) {
            console.log(`  ${entry.icon} ${color(entry.color, entry.line)}`);
        }
        console.log('');
    }

    // 统计摘要
    const success = allResults.filter(r => /✅|success/.test(r.line)).length;
    const errors = allResults.filter(r => /❌|error|fail/.test(r.line)).length;
    const warns = allResults.filter(r => /⚠️|warn/.test(r.line)).length;
    const total = allResults.length;

    console.log(color(C.cyan, '  ━━━ 摘要 ━━━'));
    console.log(`  总匹配: ${total} 条`);
    console.log(`  ${color(C.green, `成功: ${success} 次`)}`);
    if (errors > 0) console.log(`  ${color(C.red, `失败: ${errors} 次`)}`);
    if (warns > 0) console.log(`  ${color(C.yellow, `警告: ${warns} 次`)}`);
    console.log('');

    // 最近一次 TechIntel 运行时间
    try {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(STORAGE_DIR, 'data.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            console.log(color(C.gray, `  最近数据收集: ${data.date} ${data.hour}:00`));
            const stat = fs.statSync(dataPath);
            const age = Math.round((Date.now() - stat.mtimeMs) / 60000);
            console.log(color(C.gray, `  距今: ${age} 分钟前`));
        }
    } catch (e) {}
    console.log('');
}

function printHelp() {
    console.log('Usage: node search-logs.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --hours <n>     时间范围（小时），默认 24');
    console.log('  --pattern <re>  正则表达式关键词，默认 "techintel|e4166ba9"');
    console.log('  --help          显示帮助');
    console.log('');
    console.log('Examples:');
    console.log('  node search-logs.js');
    console.log('  node search-logs.js --hours 48');
    console.log('  node search-logs.js --pattern "error|fail"');
}

main().catch(e => {
    console.error('Fatal:', e.message);
    process.exit(1);
});

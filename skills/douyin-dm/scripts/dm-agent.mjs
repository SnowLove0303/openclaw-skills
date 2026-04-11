#!/usr/bin/env node
/**
 * 抖音私信 AI 自动回复 Agent
 * 
 * 用法:
 *   node dm-agent.mjs check     # 检查私信，生成回复候选
 *   node dm-agent.mjs approve  # 审批并发送所有候选回复
 *   node dm-agent.mjs dryrun   # 干跑：预览回复不发送
 *   node dm-agent.mjs auto     # 全自动：直接发送 AI 生成的回复
 *   node dm-agent.mjs status   # 查看今日处理统计
 * 
 * 依赖:
 *   - Playwright (npm install)
 *   - douyin-creator-tools 已完成登录 (.playwright/douyin-profile)
 *   - OpenClaw 已连接 AI 模型（通过 process.env.OPENCLAW_MODEL 等）
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import https from "node:https";
import readline from "node:readline/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "state.json");
const DOUYIN_CREATOR_TOOLS = process.env.DOUYIN_CREATOR_TOOLS || 
  path.join(__dirname, "../../../../../douyin-creator-tools");
const PROFILE_DIR = process.env.DOUYIN_PROFILE_DIR || 
  path.join(DOUYIN_CREATOR_TOOLS, ".playwright/douyin-profile");
const DM_PAGE_URL = "https://creator.douyin.com/creator-micro/chat/home";
const CONFIG = {
  maxMessagesPerRun: 20,
  minMessageLength: 3,
  replyDelayMin: 5000,
  replyDelayMax: 30000,
  stateFile: STATE_FILE
};

// ─────────────────────────────────────────────
//  状态管理
// ─────────────────────────────────────────────

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return { repliedIds: [], replies: {}, stats: { today: 0, total: 0, lastRun: null } };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// ─────────────────────────────────────────────
//  Playwright 启动
// ─────────────────────────────────────────────

async function launchBrowser(headless = false) {
  const { chromium } = await import(path.join(DOUYIN_CREATOR_TOOLS, "node_modules/playwright"));
  
  // 复用 douyin-creator-tools 的登录态
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: null,
    args: ["--disable-blink-features=AutomationControlled"]
  });
  
  const page = context.pages()[0] || await context.newPage();
  await page.bringToFront();
  return { context, page };
}

// ─────────────────────────────────────────────
//  私信页面操作
// ─────────────────────────────────────────────

/**
 * 导航到私信列表页，等待列表加载
 */
async function gotoDMListPage(page) {
  await page.goto(DM_PAGE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  // 等待私信列表容器出现（CSS Selector 可能因页面改版而失效，需观察调整）
  await page.waitForSelector('[class*="chat"], [class*="message-list"], .page-container', { 
    timeout: 15000 
  }).catch(() => console.log("[DM] 私信列表选择器未匹配，请手动确认页面结构"));
  await sleep(2000);
}

/**
 * 提取当前可见的所有私信条目
 * 返回结构化列表：{ id, username, avatar, text, time, isNew }
 */
async function extractMessages(page) {
  return await page.evaluate(() => {
    const items = [];
    
    // 抖音创作者中心私信列表结构（需根据实际页面调整）
    // 常见选择器模式
    const selectors = [
      '[class*="chat-item"]',
      '[class*="message-item"]', 
      '[class*="dialog-item"]',
      '.list-item',
      '[data-module*="message"]'
    ];
    
    let nodes = [];
    for (const sel of selectors) {
      nodes = document.querySelectorAll(sel);
      if (nodes.length > 0) break;
    }
    
    nodes.forEach((node) => {
      const textEl = node.querySelector('[class*="content"], [class*="text"], [class*="message"]');
      const nameEl = node.querySelector('[class*="name"], [class*="nick"]');
      const timeEl = node.querySelector('[class*="time"]');
      const id = node.getAttribute("data-id") || node.getAttribute("data-message-id") || 
                  Math.abs(hashCode(node.textContent || "")).toString();
      
      if (!textEl) return;
      const text = (textEl.textContent || "").trim();
      if (text.length < 2) return;
      
      items.push({
        id,
        username: (nameEl?.textContent || "未知用户").trim(),
        text,
        time: (timeEl?.textContent || "").trim(),
        rawHtml: node.innerHTML.substring(0, 200)
      });
    });
    
    return items;
  });
}

/**
 * 点击某条私信，打开对话详情
 */
async function openConversation(page, messageId) {
  // 点击私信列表中的条目
  const item = page.locator(`[data-id="${messageId}"], [data-message-id="${messageId}"]`).first();
  if (await item.count() > 0) {
    await item.click();
    await sleep(1500);
  }
}

/**
 * 在对话详情中提取所有消息（发送方/接收方）
 */
async function extractConversationMessages(page) {
  return await page.evaluate(() => {
    const msgs = [];
    const selectors = [
      '[class*="bubble"]',
      '[class*="message-body"]',
      '[class*="chat-bubble"]',
      '.message-item'
    ];
    
    let nodes = [];
    for (const sel of selectors) {
      nodes = document.querySelectorAll(sel);
      if (nodes.length > 0) break;
    }
    
    nodes.forEach((node, i) => {
      const isSelf = node.className.includes("self") || node.className.includes("owner");
      const text = (node.textContent || "").trim();
      if (text.length < 2) return;
      msgs.push({
        id: `msg-${i}`,
        isSelf,
        text
      });
    });
    
    return msgs;
  });
}

/**
 * 发送回复
 */
async function sendReply(page, replyText) {
  // 找到输入框并输入
  const inputSelectors = [
    'textarea[class*="input"]',
    'div[contenteditable="true"]',
    '[class*="reply-input"]',
    '[class*="message-input"]',
    'input[class*="chat"]'
  ];
  
  let sent = false;
  for (const sel of inputSelectors) {
    const input = page.locator(sel).first();
    if (await input.count() > 0) {
      await input.fill(replyText);
      await sleep(300);
      // 按回车发送
      await input.press("Enter");
      sent = true;
      break;
    }
  }
  
  if (!sent) {
    // 备用：粘贴到输入框后点击发送按钮
    await page.keyboard.type(replyText, { delay: 50 });
    await sleep(300);
    await page.keyboard.press("Enter");
  }
}

// ─────────────────────────────────────────────
//  AI 回复生成（调用 OpenClaw 模型）
// ─────────────────────────────────────────────

/**
 * 调用 OpenClaw 本地模型 API 生成回复
 * 使用 OpenClaw 的 chat completions endpoint
 */
async function generateReply(messageText, context = "") {
  const openclawUrl = process.env.OPENCLAW_API_URL || "http://localhost:18789";
  
  const systemPrompt = `你是一个抖音账号运营助手，正在帮用户回复粉丝的私信。
回复要求：
- 语气亲切、专业，符合抖音社区风格
- 回复简洁，一般不超过 100 字
- 不确定的问题不要乱答，引导关注或留言
- 禁止透露"我是AI助手"等身份
- 禁止政治敏感内容`;

  const userPrompt = `粉丝私信内容：${messageText}
${context ? "对话上下文：" + context : ""}
请生成一条合适的回复，直接输出回复内容，不要解释。`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "local",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    const req = https.request({
      hostname: new URL(openclawUrl).hostname,
      port: new URL(openclawUrl).port || 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Authorization": `Bearer ${process.env.OPENCLAW_API_KEY || "sk-openclaw"}`
      }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content?.trim() || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(30000, () => { try { req.destroy(); } catch {} resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────
//  核心流程
// ─────────────────────────────────────────────

async function runCheck(page, state) {
  console.log("[DM] 正在打开抖音创作者中心私信页...");
  await gotoDMListPage(page);
  
  // 截图供调试
  const screenshotPath = path.join(__dirname, `debug-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`[DM] 截图已保存: ${screenshotPath}`);
  
  const messages = await extractMessages(page);
  console.log(`[DM] 发现 ${messages.length} 条私信`);
  
  // 过滤未回复的
  const newMessages = messages.filter(m => !state.repliedIds.includes(m.id));
  if (newMessages.length === 0) {
    console.log("[DM] 没有新私信需要处理");
    return [];
  }
  
  console.log(`[DM] 其中 ${newMessages.length} 条未回复`);
  
  // 生成回复
  const candidates = [];
  for (const msg of newMessages.slice(0, CONFIG.maxMessagesPerRun)) {
    console.log(`[DM] 正在生成回复: ${msg.username} - "${msg.text.substring(0, 30)}..."`);
    
    const reply = await generateReply(msg.text);
    if (reply) {
      candidates.push({ ...msg, reply });
      console.log(`[DM] 回复候选: ${reply.substring(0, 50)}...`);
    } else {
      console.log(`[DM] AI 生成失败，跳过: ${msg.id}`);
    }
    
    await sleep(2000); // 避免请求过快
  }
  
  return candidates;
}

async function runDryRun(candidates) {
  console.log("\n========== 干跑模式：回复预览 ==========");
  for (const c of candidates) {
    console.log(`\n[用户] ${c.username}: ${c.text}`);
    console.log(`[AI 回复候选] ${c.reply}`);
    console.log("--".repeat(30));
  }
  console.log(`\n共计 ${candidates.length} 条回复（未实际发送）`);
}

async function runApprove(candidates, page, state) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const toSend = [];
  
  for (const c of candidates) {
    console.log(`\n[用户] ${c.username}: ${c.text}`);
    console.log(`[AI 回复候选] ${c.reply}`);
    
    const answer = await rl.question("发送这条回复? (y/n/a=全部是/q=退出): ");
    if (answer.toLowerCase() === "q") break;
    if (answer.toLowerCase() === "a") {
      toSend.push(c, ...candidates.slice(candidates.indexOf(c) + 1));
      break;
    }
    if (answer.toLowerCase() === "y") {
      toSend.push(c);
    }
  }
  
  rl.close();
  
  if (toSend.length > 0) {
    console.log(`\n[DM] 开始发送 ${toSend.length} 条回复...`);
    for (const c of toSend) {
      await openConversation(page, c.id);
      await sendReply(page, c.reply);
      state.repliedIds.push(c.id);
      state.replies[c.id] = c.reply;
      state.stats.today++;
      state.stats.total++;
      console.log(`[DM] 已发送至 ${c.username}: ${c.reply}`);
      await sleep(randomBetween(CONFIG.replyDelayMin, CONFIG.replyDelayMax));
    }
    state.stats.lastRun = new Date().toISOString();
    saveState(state);
    console.log(`[DM] 完成！今日已处理 ${state.stats.today} 条`);
  }
}

async function runAuto(candidates, page, state) {
  console.log(`[DM] 全自动模式：直接发送 ${candidates.length} 条回复`);
  
  for (const c of candidates) {
    try {
      await openConversation(page, c.id);
      await sendReply(page, c.reply);
      state.repliedIds.push(c.id);
      state.replies[c.id] = c.reply;
      state.stats.today++;
      state.stats.total++;
      console.log(`[DM] 已发送: ${c.username} → ${c.reply.substring(0, 40)}...`);
    } catch (e) {
      console.error(`[DM] 发送失败: ${c.id}`, e.message);
    }
    await sleep(randomBetween(CONFIG.replyDelayMin, CONFIG.replyDelayMax));
  }
  
  state.stats.lastRun = new Date().toISOString();
  saveState(state);
  console.log(`[DM] 完成！今日已处理 ${state.stats.today} 条`);
}

function runStatus(state) {
  console.log("\n========== 私信处理状态 ==========");
  console.log(`今日处理: ${state.stats.today} 条`);
  console.log(`累计处理: ${state.stats.total} 条`);
  console.log(`最后运行: ${state.stats.lastRun || "从未运行"}`);
  console.log(`已回复 ID 数: ${state.repliedIds.length}`);
  console.log("\n最近回复记录:");
  Object.entries(state.replies).slice(-5).forEach(([id, reply]) => {
    console.log(`  ${id}: ${reply.substring(0, 50)}...`);
  });
}

// ─────────────────────────────────────────────
//  入口
// ─────────────────────────────────────────────

const MODE = process.argv[2] || "check";

(async () => {
  const state = loadState();
  
  // 重置今日计数（每天 0 点）
  const lastRun = state.stats.lastRun ? new Date(state.stats.lastRun) : null;
  const now = new Date();
  if (lastRun && lastRun.toDateString() !== now.toDateString()) {
    state.stats.today = 0;
  }
  
  if (MODE === "status") {
    runStatus(state);
    return;
  }
  
  // check/approve/dryrun/auto 都需要浏览器
  const { context, page } = await launchBrowser(MODE === "check" || MODE === "auto");
  
  try {
    const candidates = await runCheck(page, state);
    
    if (MODE === "check" || MODE === "approve") {
      if (candidates.length === 0) {
        console.log("[DM] 没有新私信");
      } else {
        console.log(`\n[DM] 生成了 ${candidates.length} 条回复候选`);
        console.log("[DM] 使用 'npm run approve' 进入审批模式");
        console.log("[DM] 使用 'npm run dryrun' 预览回复");
        // 保存候选供审批使用
        fs.writeFileSync(path.join(__dirname, "candidates.json"), JSON.stringify(candidates, null, 2));
      }
    } else if (MODE === "dryrun") {
      await runDryRun(candidates);
    } else if (MODE === "auto") {
      await runAuto(candidates, page, state);
    }
  } finally {
    if (MODE !== "check") {
      await context.close();
    } else {
      // check 模式保持浏览器打开以便调试
      console.log("[DM] 浏览器保持打开，查看截图后按 Ctrl+C 关闭");
      await new Promise(() => {}); // 永久等待
    }
  }
})();

// ─────────────────────────────────────────────
//  工具函数
// ─────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

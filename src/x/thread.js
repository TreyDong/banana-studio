'use strict';
/* 文章 → X 推文串的内容层：加权计数（twitter-text：CJK 每字记 2、URL 固定 23、NFC 归一）、
 * Obsidian 方言转纯文本、按句边界安全切分（不劈 URL 与 emoji 字形）、编号、AI 产物解析。
 * 纯函数、可在 node --test 中单测；AI 改写的结果也要在这里做最终校验与保底切分。 */

const { parseTweet } = require('twitter-text');

const LIMIT = 280;              // X 单条加权上限
const LONG_LIMIT = 25000;       // X Premium 长推上限
const SUFFIX_RESERVE = 12;      // 编号后缀 " (12/99)" 的加权预留

function weightedLength(text) { return parseTweet(text).weightedLength; }

/* 文章 Markdown → 发推可读的纯文本。代码块整体丢弃（X 上不可读），图片引用丢弃，标记降为纯文本。 */
function toPlainText(markdown) {
  let md = String(markdown || '').replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trim();
  md = md.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '');
  md = md.replace(/!\[\[[^\]]+\]\]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
  md = md.replace(/^> ?\[![^\]]+\][+-]?\s*/gm, '');
  md = md.replace(/^#{1,6}\s+/gm, '');
  md = md.replace(/`([^`]*)`/g, '$1');
  md = md.replace(/==([^=\n]+)==/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\n]+)\*/g, '$1').replace(/~~([^~]+)~~/g, '$1');
  md = md.replace(/^\s*[-*+]\s+/gm, '· ');
  md = md.replace(/^\|.*\|$/gm, m => m.replace(/\|/g, ' ').trim()).replace(/^[-\s:]+$/gm, '');
  md = md.replace(/^> ?/gm, '');
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

/* 把纯文本切成「不可再分的最小单元」：句末标点断句、换行作为段落标记（'\n'）。 */
function segments(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) { out.push('\n'); continue; }
    const pieces = trimmed.match(/.*?[。！？!?…；;]+|.+/g) || [];
    for (const piece of pieces) { const value = piece.trim(); if (value) out.push(value); }
  }
  return out;
}

/* 段间连接符：拉丁词之间补空格，CJK 直接相连。 */
function joiner(current, item) {
  if (!current) return '';
  return /[A-Za-z0-9,;:)!\]'"”’.]$/.test(current) && /^[A-Za-z0-9(\['"“‘]/.test(item) ? ' ' : '';
}

/* 段内硬切：二分找最大的字符切点，使前缀加权 ≤ limit，且切点不落在 URL 内部。 */
function maxFit(text, limit) {
  const urls = parseTweet(text).entities?.urls || [];
  let lo = 1, hi = text.length, best = 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (weightedLength(text.slice(0, mid)) <= limit) { best = mid; lo = mid + 1; } else hi = mid - 1;
  }
  for (const [start, end] of urls) if (best > start && best < end) best = start;
  return Math.max(best, 1);
}

function hardSplit(item, limit) {
  const parts = []; let rest = item.trim();
  while (rest) {
    const cut = maxFit(rest, limit);
    const head = rest.slice(0, cut).trim();
    rest = rest.slice(cut).trim();
    if (head) parts.push(head);
    if (!rest) break;
    if (weightedLength(rest) <= limit) { parts.push(rest); break; }
  }
  return parts;
}

/* 切成条：优先装满句子，段落边界优先断条；单句超长才硬切。返回不含编号的条目数组。 */
function splitText(text, limit = LIMIT) {
  const parts = []; let current = '';
  for (const item of segments(text)) {
    if (item === '\n') { if (current.trim()) { parts.push(current.trim()); current = ''; } continue; }
    const next = current + joiner(current, item) + item;
    if (weightedLength(next) <= limit) { current = next; continue; }
    if (current.trim()) parts.push(current.trim());
    if (weightedLength(item) > limit) {
      const pieces = hardSplit(item, limit);
      for (const piece of pieces.slice(0, -1)) parts.push(piece);
      current = pieces.at(-1) || '';
    } else current = item;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

/* 编号：前缀 "1/ " 或后缀 " (1/9)"；单条不编号。 */
function applyNumbering(parts, style) {
  const total = parts.length;
  if (total < 2 || !style || style === 'none') return parts;
  return parts.map((text, index) => style === 'prefix' ? `${index + 1}/ ${text}` : `${text} (${index + 1}/${total})`);
}

function numberingReserve(style) {
  if (!style || style === 'none' || style === 'prefix') return 0; // 前缀按每条独立预留代价更大，改为切分后统一校验
  return SUFFIX_RESERVE;
}

/* 主入口：文章纯文本 → 推文串（已编号）。两遍切分保证后缀编号也不会超限。 */
function threadFromArticle(markdown, { numbering = 'suffix', limit = LIMIT } = {}) {
  const plain = toPlainText(markdown);
  if (!plain) return [];
  let parts = splitText(plain, limit - numberingReserve(numbering));
  if (numberingReserve(numbering)) {
    // 用真实条数重算后缀预留，超出者重切
    const suffixWeight = weightedLength(` (${parts.length}/${parts.length})`);
    if (suffixWeight !== numberingReserve(numbering)) parts = splitText(plain, limit - suffixWeight);
  }
  const numbered = applyNumbering(parts, numbering);
  // 最终校验：超限条目兜底重切（不重新编号，保持序号语义由调用方处理）
  for (const [index, item] of numbered.entries()) {
    if (weightedLength(item) > limit) {
      const fixed = hardSplit(item, limit - (numbering === 'suffix' && numbered.length > 1 ? weightedLength(` (${index + 1}/${numbered.length})`) : 0));
      numbered.splice(index, 1, ...fixed);
    }
  }
  return numbered;
}

/* AI 改写产物 → 推文串：接受 JSON 数组或以空行/编号分隔的纯文本；逐条校验加权长度，超限兜底切分。 */
function parseAITweets(raw, limit = LIMIT) {
  let items = [];
  const text = String(raw || '').trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) items = parsed.map(v => typeof v === 'string' ? v : String(v?.text ?? '')).filter(Boolean);
  } catch (_) { /* 非 JSON：按分隔文本处理 */ }
  if (!items.length) items = text.split(/\n{2,}/).map(s => s.replace(/^\s*\d+[.、/)]\s*/, '').trim()).filter(Boolean);
  const parts = [];
  for (const item of items) {
    const clean = String(item).trim();
    if (!clean) continue;
    if (weightedLength(clean) <= limit) parts.push(clean);
    else parts.push(...splitText(clean, limit));
  }
  return parts;
}

module.exports = { weightedLength, toPlainText, splitText, hardSplit, applyNumbering, numberingReserve, threadFromArticle, parseAITweets, segments, maxFit, LIMIT, LONG_LIMIT };

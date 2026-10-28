'use strict';
// Cover text planning: the text rendered inside the cover image is authored
// for the canvas from the article body, not copied from the article title.

function cleanLine(value, limit) {
  return String(value ?? '').replace(/[「」『』"'`*_#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function fallbackCoverText(title) {
  return { headline: cleanLine(title, 60), sub: '', source: 'title' };
}

// st.textLevel decides which fields the planner must author.
function coverTextRequirement(st) {
  if (st.textLevel === 'none') return '图面文字：本张不渲染任何文字，cover_text 返回 {"headline":"","sub":""} 即可。';
  if (st.textLevel === 'title-sub') return '图面文字：为画面重新撰写主文案与副文案，两者都不要照搬文章原标题（标题仅用于理解文章；用户本次要求沿用原标题时除外）。主文案 headline：一句适合封面的短句，直接表达文章核心判断，8 到 16 字，直白有力，中文。副文案 sub：一句补充说明，10 到 24 字，与主文案分工，不重复主文案。不得编造文章中没有的数字、承诺或专名。';
  return '图面文字：为画面重新撰写主文案 headline：一句适合封面的短句，直接表达文章核心判断，8 到 16 字，直白有力，中文。不要照搬文章原标题（标题仅用于理解文章；用户本次要求沿用原标题时除外）。不得编造文章中没有的数字、承诺或专名。';
}

function normalizeCoverText(raw, title, st = {}) {
  if (st.textLevel === 'none') return { headline: '', sub: '', source: 'none' };
  const base = raw && typeof raw === 'object' ? raw : {};
  const headline = cleanLine(base.headline, 40);
  const sub = cleanLine(base.sub, 60);
  if (!headline) return fallbackCoverText(title);
  return { headline, sub, source: 'ai' };
}

function displayTitle(coverText, title) {
  return (coverText && coverText.headline ? coverText.headline : '').trim() || String(title ?? '').trim();
}

// The free-design direction planner returns {"direction","cover_text"};
// plain-text replies from weaker models stay usable.
function parseDirectionBrief(raw) {
  const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const data = JSON.parse(cleaned);
    if (data && typeof data.direction === 'string' && data.direction.trim()) {
      return { direction: data.direction.trim(), coverText: data.cover_text || data.coverText || null };
    }
  } catch (_) { /* fall through to plain text */ }
  return { direction: cleaned, coverText: null };
}

function regionEditPrompt(region, instruction, width, height) {
  const pct = value => Math.round(value * 100);
  return 'Region edit of an existing image.\n' +
    'The reference image contains one region marked with a semi-transparent orange rectangle overlay (from the left ' + pct(region.x) + '%, from the top ' + pct(region.y) + '%, width ' + pct(region.w) + '%, height ' + pct(region.h) + '% of the image).\n' +
    'Apply this edit ONLY inside the marked region: ' + String(instruction).trim() + '\n' +
    'Keep everything outside the marked region unchanged: identical composition, framing, colors, typography and details. Do not crop, resize, restyle or redraw the rest of the image. Do not change the canvas size.\n' +
    'Do not reproduce the orange overlay or its border anywhere in the result.\n' +
    'Output canvas: ' + width + ' x ' + height + ' px.';
}

module.exports = { coverTextRequirement, normalizeCoverText, fallbackCoverText, displayTitle, parseDirectionBrief, regionEditPrompt };

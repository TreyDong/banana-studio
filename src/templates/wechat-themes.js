'use strict';
/* 公众号排版主题。每个主题携带一套逐元素内联样式（camelCase 键，由 formatter 转 style 字符串）。
 * 微信编辑器会剥离 class 与外部 CSS，所以所有样式必须内联到每个元素上。
 * 结构对齐 templates/styles.js：纯数据数组 + i18n 词条（测试校验 name/description 必须有 EN）。 */

const REQUIRED_ELEMENTS = ['h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'ul', 'ol', 'li', 'table', 'th', 'td', 'img', 'a', 'strong', 'em', 'mark', 'hr', 'code', 'pre', 'preCode'];

const WECHAT_THEMES = [
  {
    id: 'minimal',
    name: '极简黑白',
    description: '高对比黑白灰，留白克制，适合观点文与随笔。',
    accent: '#111111', text: '#333333',
    elements: {
      h1: { fontSize: '20px', fontWeight: '700', color: '#111111', textAlign: 'center', margin: '30px 0 18px', letterSpacing: '0.5px', lineHeight: '1.5' },
      h2: { fontSize: '18px', fontWeight: '700', color: '#111111', margin: '30px 0 14px', paddingLeft: '10px', borderLeft: '4px solid #111111', lineHeight: '1.4' },
      h3: { fontSize: '16px', fontWeight: '700', color: '#1f1f1f', margin: '24px 0 12px', lineHeight: '1.5' },
      h4: { fontSize: '15px', fontWeight: '700', color: '#1f1f1f', margin: '20px 0 10px', lineHeight: '1.5' },
      p: { fontSize: '15px', color: '#333333', lineHeight: '1.85', letterSpacing: '0.3px', textAlign: 'justify', margin: '0 0 18px' },
      blockquote: { margin: '0 0 18px', padding: '12px 14px', borderLeft: '3px solid #c9c9c9', background: '#f7f7f7', color: '#666666', fontSize: '14px', lineHeight: '1.8' },
      ul: { margin: '0 0 18px', paddingLeft: '22px' }, ol: { margin: '0 0 18px', paddingLeft: '22px' },
      li: { fontSize: '15px', color: '#333333', lineHeight: '1.85', margin: '0 0 6px' },
      table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 18px', fontSize: '14px' },
      th: { border: '1px solid #e0e0e0', background: '#f5f5f5', color: '#111111', padding: '8px 10px', fontWeight: '700', textAlign: 'left' },
      td: { border: '1px solid #e0e0e0', color: '#333333', padding: '8px 10px', lineHeight: '1.7' },
      img: { display: 'block', width: '100%', borderRadius: '4px', margin: '8px auto 16px' },
      a: { color: '#576b95', textDecoration: 'none', borderBottom: '1px solid #d6e0f0' },
      strong: { color: '#111111', fontWeight: '700' }, em: { color: '#111111', fontStyle: 'italic' },
      mark: { background: '#fff3b8', color: '#111111', padding: '0 2px' },
      hr: { border: 'none', borderTop: '1px solid #e5e5e5', margin: '26px auto', width: '80%' },
      code: { background: '#f2f2f2', color: '#c7254e', padding: '2px 5px', borderRadius: '3px', fontSize: '13px', fontFamily: 'Menlo, Consolas, monospace' },
      pre: { background: '#f7f7f7', borderRadius: '6px', padding: '14px', margin: '0 0 18px', overflowX: 'auto' },
      preCode: { background: 'transparent', color: '#333333', padding: '0', fontSize: '13px', lineHeight: '1.7', fontFamily: 'Menlo, Consolas, monospace', whiteSpace: 'pre-wrap' },
    },
  },
  {
    id: 'magazine',
    name: '杂志红',
    description: '衬线大标题配绯红强调，段落疏朗，适合深度长文。',
    accent: '#b03a2e', text: '#2c2c2c',
    elements: {
      h1: { fontSize: '21px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', margin: '30px 0 8px', fontFamily: 'Georgia, "Songti SC", serif', lineHeight: '1.5' },
      h2: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '32px 0 6px', paddingBottom: '8px', borderBottom: '2px solid #b03a2e', fontFamily: 'Georgia, "Songti SC", serif', lineHeight: '1.4' },
      h3: { fontSize: '16px', fontWeight: '700', color: '#b03a2e', margin: '26px 0 12px', lineHeight: '1.5' },
      h4: { fontSize: '15px', fontWeight: '700', color: '#2c2c2c', margin: '20px 0 10px', lineHeight: '1.5' },
      p: { fontSize: '15px', color: '#2c2c2c', lineHeight: '1.9', letterSpacing: '0.4px', textAlign: 'justify', margin: '0 0 20px' },
      blockquote: { margin: '0 0 20px', padding: '14px 16px', borderLeft: '3px solid #b03a2e', background: '#faf3f2', color: '#5d4037', fontSize: '14px', lineHeight: '1.9' },
      ul: { margin: '0 0 20px', paddingLeft: '22px' }, ol: { margin: '0 0 20px', paddingLeft: '22px' },
      li: { fontSize: '15px', color: '#2c2c2c', lineHeight: '1.9', margin: '0 0 8px' },
      table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 20px', fontSize: '14px' },
      th: { border: '1px solid #e8d5d3', background: '#b03a2e', color: '#ffffff', padding: '8px 10px', fontWeight: '700', textAlign: 'left' },
      td: { border: '1px solid #e8d5d3', color: '#2c2c2c', padding: '8px 10px', lineHeight: '1.7' },
      img: { display: 'block', width: '100%', borderRadius: '2px', margin: '8px auto 18px' },
      a: { color: '#b03a2e', textDecoration: 'none', borderBottom: '1px solid #e5c1bd' },
      strong: { color: '#b03a2e', fontWeight: '700' }, em: { color: '#2c2c2c', fontStyle: 'italic' },
      mark: { background: '#fdebd0', color: '#922b21', padding: '0 2px' },
      hr: { border: 'none', textAlign: 'center', margin: '28px auto', width: '30%', borderTop: '3px double #d9b8b4' },
      code: { background: '#f6efee', color: '#b03a2e', padding: '2px 5px', borderRadius: '3px', fontSize: '13px', fontFamily: 'Menlo, Consolas, monospace' },
      pre: { background: '#2b2b2b', borderRadius: '6px', padding: '14px', margin: '0 0 20px', overflowX: 'auto' },
      preCode: { background: 'transparent', color: '#f5e9e7', padding: '0', fontSize: '13px', lineHeight: '1.7', fontFamily: 'Menlo, Consolas, monospace', whiteSpace: 'pre-wrap' },
    },
  },
  {
    id: 'warm',
    name: '暖调手记',
    description: '琥珀色强调与米色引用底，节奏松弛，适合生活与笔记分享。',
    accent: '#c07830', text: '#3d3929',
    elements: {
      h1: { fontSize: '20px', fontWeight: '700', color: '#3d3929', textAlign: 'center', margin: '30px 0 18px', lineHeight: '1.5' },
      h2: { fontSize: '18px', fontWeight: '700', color: '#3d3929', margin: '30px 0 14px', paddingLeft: '10px', borderLeft: '4px solid #c07830', lineHeight: '1.4' },
      h3: { fontSize: '16px', fontWeight: '700', color: '#c07830', margin: '24px 0 12px', lineHeight: '1.5' },
      h4: { fontSize: '15px', fontWeight: '700', color: '#3d3929', margin: '20px 0 10px', lineHeight: '1.5' },
      p: { fontSize: '15px', color: '#3d3929', lineHeight: '1.9', letterSpacing: '0.3px', textAlign: 'justify', margin: '0 0 18px' },
      blockquote: { margin: '0 0 18px', padding: '13px 15px', borderLeft: '3px solid #e2b071', background: '#fbf5ec', color: '#7a6a52', fontSize: '14px', lineHeight: '1.9', borderRadius: '0 6px 6px 0' },
      ul: { margin: '0 0 18px', paddingLeft: '22px' }, ol: { margin: '0 0 18px', paddingLeft: '22px' },
      li: { fontSize: '15px', color: '#3d3929', lineHeight: '1.9', margin: '0 0 6px' },
      table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 18px', fontSize: '14px' },
      th: { border: '1px solid #eadfcf', background: '#f7efe3', color: '#3d3929', padding: '8px 10px', fontWeight: '700', textAlign: 'left' },
      td: { border: '1px solid #eadfcf', color: '#3d3929', padding: '8px 10px', lineHeight: '1.7' },
      img: { display: 'block', width: '100%', borderRadius: '8px', margin: '8px auto 16px' },
      a: { color: '#c07830', textDecoration: 'none', borderBottom: '1px solid #ecd9c2' },
      strong: { color: '#a3601f', fontWeight: '700' }, em: { color: '#3d3929', fontStyle: 'italic' },
      mark: { background: '#fbe3b6', color: '#7c4a12', padding: '0 2px', borderRadius: '2px' },
      hr: { border: 'none', borderTop: '1px dashed #dcc9ab', margin: '26px auto' },
      code: { background: '#f7efe3', color: '#a3601f', padding: '2px 5px', borderRadius: '3px', fontSize: '13px', fontFamily: 'Menlo, Consolas, monospace' },
      pre: { background: '#f7efe3', borderRadius: '8px', padding: '14px', margin: '0 0 18px', overflowX: 'auto' },
      preCode: { background: 'transparent', color: '#4a4234', padding: '0', fontSize: '13px', lineHeight: '1.7', fontFamily: 'Menlo, Consolas, monospace', whiteSpace: 'pre-wrap' },
    },
  },
  {
    id: 'tech',
    name: '技术蓝',
    description: '深色代码块与蓝色强调，信息密度高，适合技术与教程。',
    accent: '#2563eb', text: '#26313f',
    elements: {
      h1: { fontSize: '20px', fontWeight: '700', color: '#111c2e', textAlign: 'center', margin: '30px 0 18px', lineHeight: '1.5' },
      h2: { fontSize: '18px', fontWeight: '700', color: '#ffffff', background: '#2563eb', borderRadius: '4px', padding: '6px 12px', margin: '30px 0 14px', lineHeight: '1.4' },
      h3: { fontSize: '16px', fontWeight: '700', color: '#1d4ed8', margin: '24px 0 12px', lineHeight: '1.5' },
      h4: { fontSize: '15px', fontWeight: '700', color: '#111c2e', margin: '20px 0 10px', lineHeight: '1.5' },
      p: { fontSize: '15px', color: '#26313f', lineHeight: '1.85', letterSpacing: '0.2px', textAlign: 'justify', margin: '0 0 16px' },
      blockquote: { margin: '0 0 16px', padding: '12px 14px', borderLeft: '3px solid #93b4fc', background: '#f0f5ff', color: '#3b4a5f', fontSize: '14px', lineHeight: '1.8' },
      ul: { margin: '0 0 16px', paddingLeft: '22px' }, ol: { margin: '0 0 16px', paddingLeft: '22px' },
      li: { fontSize: '15px', color: '#26313f', lineHeight: '1.85', margin: '0 0 6px' },
      table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 16px', fontSize: '14px' },
      th: { border: '1px solid #dbe4f0', background: '#eef3fb', color: '#111c2e', padding: '8px 10px', fontWeight: '700', textAlign: 'left' },
      td: { border: '1px solid #dbe4f0', color: '#26313f', padding: '8px 10px', lineHeight: '1.7' },
      img: { display: 'block', width: '100%', borderRadius: '6px', margin: '8px auto 16px', border: '1px solid #e3e9f2' },
      a: { color: '#2563eb', textDecoration: 'none', borderBottom: '1px solid #c3d4f9' },
      strong: { color: '#1d4ed8', fontWeight: '700' }, em: { color: '#26313f', fontStyle: 'italic' },
      mark: { background: '#d3e3fd', color: '#12326e', padding: '0 2px' },
      hr: { border: 'none', borderTop: '1px solid #d5deeb', margin: '24px auto' },
      code: { background: '#eef2f8', color: '#c7254e', padding: '2px 5px', borderRadius: '3px', fontSize: '13px', fontFamily: 'Menlo, Consolas, monospace' },
      pre: { background: '#0f172a', borderRadius: '8px', padding: '14px', margin: '0 0 16px', overflowX: 'auto' },
      preCode: { background: 'transparent', color: '#dbe6f5', padding: '0', fontSize: '13px', lineHeight: '1.7', fontFamily: 'Menlo, Consolas, monospace', whiteSpace: 'pre-wrap' },
    },
  },
];

function wechatThemes() { return WECHAT_THEMES; }
function wechatTheme(id) { return WECHAT_THEMES.find(theme => theme.id === id) || WECHAT_THEMES[0]; }
function themeLabel(theme, key = 'name') { return theme?.[key] || theme?.id || ''; }

/* 主题选择卡的离线预览（纯 SVG，仿 styles.js previewSvg 的做法）。 */
function themePreview(theme) {
  const e = theme.elements, accent = theme.accent, text = theme.text;
  return `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`
    + `<rect width="200" height="140" fill="#ffffff" rx="8"/>`
    + `<rect x="20" y="20" width="8" height="16" fill="${accent}"/><rect x="34" y="22" width="70" height="12" rx="2" fill="${text}"/>`
    + `<rect x="20" y="48" width="160" height="5" rx="2.5" fill="${text}" opacity="0.75"/>`
    + `<rect x="20" y="60" width="150" height="5" rx="2.5" fill="${text}" opacity="0.55"/>`
    + `<rect x="20" y="72" width="90" height="34" rx="4" fill="${e.blockquote.background}"/><rect x="20" y="72" width="3" height="34" fill="${e.blockquote.borderLeft || accent}"/>`
    + `<rect x="30" y="82" width="66" height="4" rx="2" fill="${text}" opacity="0.6"/><rect x="30" y="92" width="52" height="4" rx="2" fill="${text}" opacity="0.4"/>`
    + `<rect x="20" y="118" width="40" height="8" rx="2" fill="${e.a.color}"/></svg>`;
}

/* 主题名称与描述的英文词条，由 i18n.js 合并进 EN（与 styles.js 的 STYLE_MESSAGES 同机制）。 */
const THEME_MESSAGES = {
  '极简黑白': 'Minimal mono',
  '高对比黑白灰，留白克制，适合观点文与随笔。': 'High-contrast black and white with restrained spacing, for opinion pieces and essays.',
  '杂志红': 'Magazine crimson',
  '衬线大标题配绯红强调，段落疏朗，适合深度长文。': 'Serif headlines with crimson accents and airy paragraphs, for long-form features.',
  '暖调手记': 'Warm journal',
  '琥珀色强调与米色引用底，节奏松弛，适合生活与笔记分享。': 'Amber accents on cream quotes with a relaxed rhythm, for lifestyle notes and sharing.',
  '技术蓝': 'Tech blue',
  '深色代码块与蓝色强调，信息密度高，适合技术与教程。': 'Dark code blocks with blue accents, dense and practical, for technical write-ups and tutorials.',
};

module.exports = { WECHAT_THEMES, REQUIRED_ELEMENTS, wechatThemes, wechatTheme, themeLabel, themePreview, THEME_MESSAGES };

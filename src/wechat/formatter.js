'use strict';
/* Markdown → 微信公众号兼容的内联样式 HTML。
 * 微信编辑器会剥离 class、id 与外部 CSS，所以全部样式以 style 属性内联到每个元素。
 * 用 marked 的自定义 renderer 逐元素套主题样式：纯 JS、无 DOM 依赖，可在 node --test 中单测。
 * 本地图片在预处理阶段抽成 bdimg://N 占位，渲染为 %%BDIMGN%%，由调用方上传后回填真实 URL。 */

const { Marked } = require('marked');

const IMAGE_PROTOCOL = 'bdimg://';
const PLACEHOLDER_PREFIX = '%%BDIMG';

function imagePlaceholder(index) { return PLACEHOLDER_PREFIX + index + '%%'; }

function escapeHtml(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function styleString(style) {
  return Object.entries(style || {}).map(([key, value]) => key.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + ':' + value).join(';');
}

/* 代码内容先摘出去，避免 Obsidian 方言预处理改写代码块里的内容。 */
function protectCode(markdown) {
  const blocks = [], spans = [];
  let md = markdown.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, m => { blocks.push(m); return '\u0000BDCB' + (blocks.length - 1) + '\u0000'; });
  md = md.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, m => { spans.push(m); return '\u0000BDCS' + (spans.length - 1) + '\u0000'; });
  return { md, blocks, spans };
}

/* Obsidian 方言 → 标准 Markdown：
 * ![[图片]] 与本地 ![]() 抽成 bdimg://N 占位；[[链接]] 转纯文本；
 * ==高亮== 转 <mark>；> [!note] 标题 转普通引用块（首行加粗）。 */
function preprocessObsidian(markdown) {
  const { md: protected_, blocks, spans } = protectCode(String(markdown || ''));
  const images = [];
  const take = (raw) => { images.push(raw); return `![bdimg](${IMAGE_PROTOCOL}${images.length - 1})`; };
  let md = protected_.replace(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g, (_, path) => take(path.trim()));
  md = md.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => /^(https?:|data:|bdimg:)/i.test(src) ? m : take(src));
  md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
  md = md.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
  md = md.replace(/^> ?\[![^\]]+\][+-]?\s*(.*)$/gm, (_, rest) => '> **' + rest + '**');
  md = md.replace(/\u0000BDCB(\d+)\u0000/g, (_, i) => blocks[+i]).replace(/\u0000BDCS(\d+)\u0000/g, (_, i) => spans[+i]);
  return { md: md.trim(), images };
}

/* marked v16+ 的 use({renderer}) 会枚举对象自有属性当作方法名，所以用工厂返回纯对象；
 * marked 在调用时注入 this.parser 用于解析内联/块级 token。 */
function buildRenderer(theme) {
  const s = key => styleString(theme.elements[key]);
  return {
    heading({ tokens, depth }) {
      const tag = 'h' + Math.min(Math.max(depth, 1), 6);
      const key = depth <= 4 ? tag : 'h4';
      return `<${tag} style="${s(key)}">${this.parser.parseInline(tokens)}</${tag}>`;
    },
    paragraph({ tokens }) { return `<p style="${s('p')}">${this.parser.parseInline(tokens)}</p>`; },
    blockquote({ tokens }) { return `<blockquote style="${s('blockquote')}">${this.parser.parse(tokens)}</blockquote>`; },
    code({ text }) { return `<pre style="${s('pre')}"><code style="${s('preCode')}">${escapeHtml(text)}</code></pre>`; },
    codespan({ text }) { return `<code style="${s('code')}">${escapeHtml(text)}</code>`; },
    list(token) {
      const tag = token.ordered ? 'ol' : 'ul';
      const start = token.ordered && token.start !== null && token.start !== '' && token.start !== 1 ? ` start="${token.start}"` : '';
      return `<${tag} style="${s(tag)}"${start}>` + token.items.map(item => this.listitem(item)).join('') + `</${tag}>`;
    },
    listitem(item) {
      const inner = item.tokens.map(tok => tok.type === 'text'
        ? this.parser.parseInline(tok.tokens || [{ type: 'text', raw: tok.text, text: tok.text }])
        : this.parser.parse([tok])).join('');
      const checkbox = item.task ? `<span>${item.checked ? '☑ ' : '☐ '}</span>` : '';
      return `<li style="${s('li')}">${checkbox}${inner}</li>`;
    },
    table(token) {
      const head = `<tr>${token.header.map(cell => `<th style="${s('th')}">${this.parser.parseInline(cell.tokens)}</th>`).join('')}</tr>`;
      const body = token.rows.map(row => `<tr>${row.map(cell => `<td style="${s('td')}">${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`).join('');
      return `<table style="${s('table')}"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    },
    image({ href, title, text }) {
      if (String(href).startsWith(IMAGE_PROTOCOL)) {
        const index = Number(String(href).slice(IMAGE_PROTOCOL.length));
        return `<img src="${imagePlaceholder(index)}" alt="${escapeHtml(text)}" style="${s('img')}">`;
      }
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} style="${s('img')}">`;
    },
    link({ href, title, tokens }) {
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''} style="${s('a')}">${this.parser.parseInline(tokens)}</a>`;
    },
    strong({ tokens }) { return `<strong style="${s('strong')}">${this.parser.parseInline(tokens)}</strong>`; },
    em({ tokens }) { return `<em style="${s('em')}">${this.parser.parseInline(tokens)}</em>`; },
    del({ tokens }) { return `<del style="${s(theme.elements.del ? 'del' : 'em')}">${this.parser.parseInline(tokens)}</del>`; },
    hr() { return `<hr style="${s('hr')}">`; },
  };
}

/* 主入口：返回 { html, images }。html 中的 %%BDIMGN%% 与 images[N] 一一对应，发布前回填。 */
function formatWechat(markdown, theme) {
  if (!theme?.elements) throw new Error('排版主题缺少样式数据');
  const { md, images } = preprocessObsidian(markdown);
  const engine = new Marked({ gfm: true, breaks: false });
  engine.use({ renderer: buildRenderer(theme) });
  let html = engine.parse(md, { async: false });
  html = html.replace(/<mark>/g, `<mark style="${styleString(theme.elements.mark)}">`);
  return { html: html.trim(), images };
}

/* 摘要兜底：取第一段正文纯文本（跳过标题行），截 120 字。 */
function autoDigest(markdown) {
  const { md } = preprocessObsidian(markdown);
  for (const line of md.split(/\n+/)) {
    if (/^\s*#{1,6}\s/.test(line)) continue;
    const text = line.replace(/^>\s*|^[-*+]\s+|[*_`[\]()#>]/g, '').trim();
    if (text) return text.slice(0, 120);
  }
  return '';
}

module.exports = { formatWechat, preprocessObsidian, autoDigest, styleString, escapeHtml, imagePlaceholder, IMAGE_PROTOCOL };

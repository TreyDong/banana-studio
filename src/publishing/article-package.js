'use strict';

/* Transport-neutral snapshot. No network, credentials, vault writes or publish side effects.
 * Consumers must resolve banana-asset:// IDs before putting HTML into a platform editor.
 * Markdown is retained as source; only article.html is prepared for browser delivery. */
const { createHash, randomUUID } = require('node:crypto');
const { imagePlaceholder } = require('../wechat/formatter');

const DEFAULT_LIMITS = Object.freeze({ imageBytes: 12 * 1024 * 1024, packageBytes: 32 * 1024 * 1024 });
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
const hash = value => createHash('sha256').update(value).digest('hex');
function failure(code, message) { const error = new Error(message); error.code = code; return error; }

async function buildArticlePackage({ title, markdown = '', formatted, coverRef = '', themeId = '', author = '', digest = '', resolveImage, limits = {} }) {
  if (!String(title || '').trim() || typeof formatted?.html !== 'string' || !Array.isArray(formatted.images)) {
    throw failure('INVALID_ARTICLE', '文章标题或排版内容不完整');
  }
  const caps = { ...DEFAULT_LIMITS, ...limits };
  if (![caps.imageBytes, caps.packageBytes].every(n => Number.isSafeInteger(n) && n > 0)) throw failure('INVALID_LIMITS', '图片和文章大小限制必须为正整数');
  const assets = [], byReference = new Map(), byContent = new Map();
  let encodedAssetBytes = 0;
  const getAsset = async ref => {
    if (byReference.has(ref)) return byReference.get(ref);
    if (typeof resolveImage !== 'function') throw failure('MISSING_RESOLVER', '无法读取文章图片');
    const resolved = await resolveImage(ref);
    if (!resolved?.data) throw failure('IMAGE_MISSING', '图片未找到：' + ref);
    const data = ArrayBuffer.isView(resolved.data)
      ? Buffer.from(resolved.data.buffer, resolved.data.byteOffset, resolved.data.byteLength)
      : Buffer.from(resolved.data);
    if (!data.length) throw failure('IMAGE_EMPTY', '图片为空：' + ref);
    if (data.length > caps.imageBytes) throw failure('IMAGE_TOO_LARGE', '图片超过交接大小限制：' + ref);
    // Only a basename crosses the boundary, never a resolver's absolute file path.
    const fileName = String(resolved.fileName || ref).split(/[\\/]/).pop();
    const mime = MIME[fileName.split('.').pop().toLowerCase()];
    if (!mime || (resolved.mime && resolved.mime !== mime)) throw failure('IMAGE_TYPE_UNSUPPORTED', '图片格式不支持：' + fileName);
    const sha256 = hash(data), contentKey = mime + ':' + sha256;
    let asset = byContent.get(contentKey);
    if (!asset) {
      encodedAssetBytes += 4 * Math.ceil(data.length / 3);
      if (encodedAssetBytes > caps.packageBytes) throw failure('PACKAGE_TOO_LARGE', '文章和图片超过交接大小限制');
      asset = { id: 'img-' + hash(contentKey), fileName, mime, bytes: data.length, sha256, base64: data.toString('base64') };
      assets.push(asset); byContent.set(contentKey, asset);
    }
    byReference.set(ref, asset);
    return asset;
  };

  let html = formatted.html;
  const imageBindings = [];
  for (let index = 0; index < formatted.images.length; index++) {
    const ref = formatted.images[index], placeholder = imagePlaceholder(index);
    if (!html.includes(placeholder)) throw failure('IMAGE_BINDING_INVALID', '排版图片位置缺失：' + ref);
    const asset = await getAsset(ref);
    imageBindings.push({ index, ref, assetId: asset.id });
    html = html.split(placeholder).join('banana-asset://' + asset.id);
  }
  if (/%%BDIMG\d+%%/.test(html)) throw failure('IMAGE_BINDING_INVALID', '排版仍有未绑定的图片');
  const cover = coverRef ? await getAsset(coverRef) : null;
  const article = { title: String(title).trim(), markdown: String(markdown), html, themeId: String(themeId), author: String(author).slice(0, 8), digest: String(digest).slice(0, 120), coverAssetId: cover?.id || null, imageBindings };
  const snapshotHash = hash(JSON.stringify({ article, assets: assets.map(({ id, mime, sha256 }) => ({ id, mime, sha256 })) }));
  const packet = { version: 1, kind: 'banana.article', requestId: randomUUID(), createdAt: new Date().toISOString(), snapshotHash, article, assets };
  if (Buffer.byteLength(JSON.stringify(packet)) > caps.packageBytes) throw failure('PACKAGE_TOO_LARGE', '文章和图片超过交接大小限制');
  return packet;
}

module.exports = { buildArticlePackage, DEFAULT_LIMITS };

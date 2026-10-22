'use strict';
/* 微信公众号 API 客户端（草稿箱路线，需要已认证公众号）。
 * 流程：access_token（内存缓存，失效自动刷新重试一次）→ uploadimg 上传正文图 →
 * add_material 上传封面 → draft/add 建草稿。最终群发仍在公众号后台人工确认。
 * 网络层复用 model-services 的 request（HTTPS 强制、120s 超时、60MB 上限）。 */

const crypto = require('crypto');
const { t } = require('../i18n');

const BASE = 'https://api.weixin.qq.com';
const TOKEN_TTL_MARGIN = 300; // 提前 5 分钟视为过期，避免边界抖动
const TOKEN_ERRORS = [40001, 40014, 42001];
const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' };

class TokenError extends Error {
  constructor(message) { super(message); this.name = 'TokenError'; }
}

function wechatError(data) {
  const code = data.errcode, msg = data.errmsg || '';
  let hint = '';
  if (code === 40164) hint = t('（当前出口 IP 不在白名单：请到公众号后台「设置与开发-基本配置」把本机 IP 加入 IP 白名单）');
  else if (code === 40001) hint = t('（请核对 AppSecret 是否正确）');
  else if (code === 40013) hint = t('（请核对 AppID 是否正确）');
  else if (code === 45009) hint = t('（接口调用次数已达上限，请稍后再试）');
  else if (code === 40007) hint = t('（媒体文件不被支持，请使用 PNG / JPG）');
  const e = new Error(t('微信接口错误 {code}：{msg}', { code, msg }) + hint);
  e.errcode = code;
  // 40164 的 errmsg 形如 "invalid ip 1.2.3.4 ipv6 ::1, not in whitelist"，可解析出实际生效的出口 IP
  const match = code === 40164 ? /invalid ip ([0-9a-fA-F.:]+)/.exec(msg) : null;
  if (match) e.callerIp = match[1];
  return e;
}

function imageMime(filename) {
  const ext = String(filename || '').split('.').pop().toLowerCase();
  return MIME_BY_EXT[ext] || 'image/png';
}

function formData(file) {
  const boundary = 'bd-wechat-' + crypto.randomBytes(12).toString('hex');
  const parts = [];
  parts.push(Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="media"; filename="image.' + String(file.ext || 'png').replace(/^\./, '') + '"\r\nContent-Type: ' + file.mime + '\r\n\r\n'));
  parts.push(file.buf);
  parts.push(Buffer.from('\r\n--' + boundary + '--\r\n'));
  return { body: Buffer.concat(parts), contentType: 'multipart/form-data; boundary=' + boundary };
}

/* 反代地址校验与归一：留空直连官方；配置后所有请求改走该根地址（错误词条复用 model-services 既有文案）。 */
function normalizeApiBase(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return BASE;
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(t('请填写 HTTP / HTTPS API 根地址，不包含密钥或查询参数'));
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error(t('远程 API 必须使用 HTTPS；仅本机服务可用 HTTP'));
  return raw;
}

class WechatClient {
  /* relayRequest：可选的「固定 IP 中转」传输（如 SSH 隧道）。取 token 固定走它；
   * 其余请求直连，仅在意外收到 40164 时改走中转重试一次。 */
  constructor(appId, secret, request, apiBase, relayRequest) {
    this.appId = String(appId || '').trim();
    this.secret = String(secret || '');
    this.request = request || require('../services/model-services.js').request;
    this.relayRequest = typeof relayRequest === 'function' ? relayRequest : null;
    this.base = normalizeApiBase(apiBase);
    this.token = '';
    this.tokenExpireAt = 0;
    this.forceRelay = false;
  }
  /* 连通性探测：真实请求一次 token；40164 时错误对象带 callerIp（当前生效出口 IP）。 */
  async probe(signal) { await this.accessToken(signal, true); return { ok: true }; }
  async accessToken(signal, force = false) {
    if (!force && this.token && Date.now() < this.tokenExpireAt) return this.token;
    const url = `${this.base}/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(this.appId)}&secret=${encodeURIComponent(this.secret)}`;
    const response = await (this.relayRequest || this.request)(url, { signal, timeout: 60000 });
    let data = {}; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) {}
    if (response.status >= 400) throw new Error('HTTP ' + response.status);
    if (!data.access_token) throw wechatError(data);
    this.token = data.access_token;
    this.tokenExpireAt = Date.now() + (Math.max((data.expires_in || 7200) - TOKEN_TTL_MARGIN, 60)) * 1000;
    return this.token;
  }
  async json(url, options = {}) {
    const transport = this.forceRelay && this.relayRequest ? this.relayRequest : this.request;
    const response = await transport(url, options);
    if (options.signal?.aborted) throw abortError();
    let data = {}; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) {}
    if (response.status >= 400) throw new Error('HTTP ' + response.status + ' ' + response.buf.toString('utf8').slice(0, 200));
    if (data.errcode) {
      if (TOKEN_ERRORS.includes(data.errcode)) throw new TokenError(wechatError(data).message);
      throw wechatError(data);
    }
    return data;
  }
  /* access_token 失效（40001/40014/42001）时强制刷新并重试一次；
   * 直连请求被白名单拦（40164）且配置了中转时，改走中转重试一次。 */
  async withToken(run, signal) {
    await this.accessToken(signal);
    try { return await run(this.token); }
    catch (e) {
      if (e instanceof TokenError) {
        const token = await this.accessToken(signal, true);
        return run(token);
      }
      if (e.errcode === 40164 && this.relayRequest && !this.forceRelay) {
        this.forceRelay = true;
        try { return await run(this.token); } finally { this.forceRelay = false; }
      }
      throw e;
    }
  }
  async uploadContentImage(buf, filename, signal) {
    const ext = String(filename || 'image.png').split('.').pop().toLowerCase();
    return this.withToken(async token => {
      const form = formData({ buf, ext, mime: imageMime(filename) });
      const data = await this.json(`${this.base}/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(token)}`, { method: 'POST', body: form.body, headers: { 'Content-Type': form.contentType }, signal });
      if (!data.url) throw new Error(t('微信没有返回正文图片地址'));
      return { url: data.url };
    }, signal);
  }
  async uploadCover(buf, filename, signal) {
    const ext = String(filename || 'cover.png').split('.').pop().toLowerCase();
    return this.withToken(async token => {
      const form = formData({ buf, ext, mime: imageMime(filename) });
      const data = await this.json(`${this.base}/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`, { method: 'POST', body: form.body, headers: { 'Content-Type': form.contentType }, signal, timeout: 180000 });
      if (!data.media_id) throw new Error(t('微信没有返回封面素材 ID'));
      return { mediaId: data.media_id, url: data.url || '' };
    }, signal);
  }
  async addDraft(article, signal) {
    return this.withToken(async token => {
      const data = await this.json(`${this.base}/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`, { method: 'POST', json: { articles: [normalizeArticle(article)] }, signal });
      if (!data.media_id) throw new Error(t('微信没有返回草稿 ID'));
      return { mediaId: data.media_id };
    }, signal);
  }
}

function normalizeArticle(article) {
  const title = String(article?.title || '').trim();
  if (!title) throw new Error(t('草稿标题不能为空'));
  const content = String(article?.content || '').trim();
  if (!content) throw new Error(t('草稿正文为空，请先排版预览'));
  if (!article?.thumbMediaId) throw new Error(t('草稿缺少封面，请先上传或选择封面'));
  return {
    title: title.slice(0, 64),
    author: String(article?.author || '').trim().slice(0, 8),
    digest: String(article?.digest || '').trim().slice(0, 120),
    content,
    thumb_media_id: article.thumbMediaId,
    need_open_comment: 0,
    only_fans_can_comment: 0,
  };
}

function abortError() { const e = new Error(t('已停止')); e.name = 'AbortError'; return e; }

module.exports = { WechatClient, normalizeArticle, wechatError, normalizeApiBase, formData, imageMime, BASE };

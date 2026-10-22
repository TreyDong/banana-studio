'use strict';
/* HTTP(S) 正向代理传输：通过 Clash / Surge 等本地代理（如 http://127.0.0.1:7890）的 CONNECT 隧道访问 HTTPS 服务。
 * Node 的 https 模块不读系统代理设置，所以需要显式配置；主要用于访问 api.x.com 这类国内不可直连的接口。 */

const net = require('net');
const tls = require('tls');
const { t } = require('../i18n');
const { tlsOverSocket, httpsOverSocket, connectOverSocket, abortError } = require('./socket-https');

function normalizeProxyUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let url;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'http://' + raw); }
  catch (_) { throw new Error(t('代理地址格式无效，例如 http://127.0.0.1:7890')); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(t('代理仅支持 http:// 或 https://（CONNECT 隧道）'));
  if (!url.hostname) throw new Error(t('代理地址格式无效，例如 http://127.0.0.1:7890'));
  return url.href.replace(/\/+$/, '');
}

function openProxySocket(proxy, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const port = Number(proxy.port) || (proxy.protocol === 'https:' ? 443 : 80);
    const fail = e => { signal?.removeEventListener('abort', stop); reject(signal?.aborted ? abortError() : new Error(t('无法连接代理 {host}:{port}（{code}）', { host: proxy.hostname, port, code: e.code || e.message }))); };
    const socket = proxy.protocol === 'https:'
      ? tls.connect({ host: proxy.hostname, port, servername: proxy.hostname }, () => done())
      : net.connect({ host: proxy.hostname, port }, () => done());
    const stop = () => { socket.destroy(); fail(abortError()); };
    const done = () => { socket.removeListener('error', fail); signal?.removeEventListener('abort', stop); resolve(socket); };
    socket.once('error', fail);
    signal?.addEventListener('abort', stop, { once: true });
  });
}

/* 经代理发一次 HTTPS 请求；返回与 model-services.request 相同的 {status, headers, buf}。options.tls 仅供测试注入自签名 CA。 */
async function proxyRequest(proxyUrl, url, options = {}) {
  const proxy = new URL(normalizeProxyUrl(proxyUrl));
  const target = new URL(url);
  if (target.protocol !== 'https:') throw new Error(t('隧道只支持 HTTPS 地址'));
  const socket = await openProxySocket(proxy, options.signal);
  try {
    const proxyAuth = proxy.username ? Buffer.from(decodeURIComponent(proxy.username) + ':' + decodeURIComponent(proxy.password || '')).toString('base64') : '';
    await connectOverSocket(socket, target, { signal: options.signal, proxyAuth });
    const secure = await tlsOverSocket(socket, options.tls?.servername || target.hostname, options.tls);
    return await httpsOverSocket(secure, target, options);
  } catch (e) { socket.destroy(); throw e; }
}

module.exports = { normalizeProxyUrl, proxyRequest };

'use strict';
/* 共用的「在既有套接字上做 TLS + HTTPS」工具。
 * ssh-relay（SSH direct-tcpip 通道）和 proxy（HTTP CONNECT 隧道）都把远端
 * 套接字交给这里，统一完成 TLS 握手、请求发送、响应收取、超时与中止。 */

const tls = require('tls');
const https = require('https');
const { t } = require('../i18n');

const MAX_BODY = 60 * 1024 * 1024;

function abortError() { const e = new Error(t('已停止')); e.name = 'AbortError'; return e; }

function tlsOverSocket(socket, servername, overrides) {
  return new Promise((resolve, reject) => {
    const secure = tls.connect({ socket, servername, rejectUnauthorized: true, ...(overrides || {}) }, () => resolve(secure));
    secure.once('error', reject);
  });
}

/* 在已建立的 TLS 套接字上发 HTTPS 请求；返回与 model-services.request 相同的 {status, headers, buf}。 */
function httpsOverSocket(socket, target, options = {}) {
  return new Promise((resolve, reject) => {
    const { signal, timeout = 120000 } = options;
    const body = options.body != null ? Buffer.from(options.body) : options.json != null ? Buffer.from(JSON.stringify(options.json)) : null;
    const headers = { ...options.headers };
    if (options.json != null) headers['Content-Type'] = 'application/json';
    if (body) headers['Content-Length'] = body.length;
    let settled = false, timer;
    const finish = (error, result) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', stop); socket.destroy(); error ? reject(error) : resolve(result); };
    const stop = () => { const e = abortError(); req.destroy(e); finish(e); };
    const req = https.request({ host: target.hostname, port: Number(target.port) || 443, path: target.pathname + target.search, method: options.method || (body ? 'POST' : 'GET'), headers, createConnection: () => socket }, res => {
      const chunks = []; let length = 0;
      res.on('data', chunk => { length += chunk.length; if (length > MAX_BODY) { const e = new Error(t('服务返回的图片过大')); req.destroy(e); finish(e); } else chunks.push(chunk); });
      res.on('error', e => finish(signal?.aborted ? abortError() : e));
      res.on('end', () => finish(null, { status: res.statusCode, headers: res.headers, buf: Buffer.concat(chunks) }));
    });
    req.on('error', e => finish(signal?.aborted ? abortError() : e));
    signal?.addEventListener('abort', stop, { once: true });
    timer = setTimeout(() => { const e = new Error(t('模型服务请求超时')); req.destroy(e); finish(e); }, timeout);
    if (body) req.write(body); req.end();
  });
}

/* 在裸 TCP 套接字上发 HTTP CONNECT，成功后返回同一套接字（已升级为到目标的隧道）。 */
function connectOverSocket(socket, target, options = {}) {
  return new Promise((resolve, reject) => {
    const { signal, timeout = 30000 } = options;
    const port = Number(target.port) || 443;
    const lines = [`CONNECT ${target.hostname}:${port} HTTP/1.1`, `Host: ${target.hostname}:${port}`];
    if (options.proxyAuth) lines.push('Proxy-Authorization: Basic ' + options.proxyAuth);
    lines.push('Connection: keep-alive', '', '');
    let settled = false, buffer = '';
    const finish = error => {
      if (settled) return; settled = true;
      socket.setTimeout(0); signal?.removeEventListener('abort', stop); socket.removeListener('error', onError);
      error ? reject(error) : resolve(socket);
    };
    const stop = () => { socket.destroy(); finish(abortError()); };
    const onError = e => finish(signal?.aborted ? abortError() : e);
    socket.setTimeout(timeout, () => { socket.destroy(); finish(new Error(t('代理连接超时'))); });
    socket.on('data', function onData(chunk) {
      buffer += chunk.toString('latin1');
      const end = buffer.indexOf('\r\n\r\n');
      if (end < 0) return;
      socket.removeListener('data', onData);
      const status = /^HTTP\/1\.[01] (\d{3})/.exec(buffer);
      if (status && status[1] === '200') finish(null);
      else { socket.destroy(); finish(new Error(t('代理拒绝了 CONNECT 请求（{code}）', { code: status ? status[1] : buffer.split('\r\n')[0].slice(0, 60) }))); }
    });
    socket.on('error', onError);
    signal?.addEventListener('abort', stop, { once: true });
    socket.write(lines.join('\r\n'));
  });
}

module.exports = { tlsOverSocket, httpsOverSocket, connectOverSocket, abortError, MAX_BODY };

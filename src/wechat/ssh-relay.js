'use strict';
/* SSH 隧道中转：用用户提供的 SSH 账号连到有固定 IP 的服务器，在服务器上开一条 direct-tcpip
 * 通道到 api.weixin.qq.com:443，再在通道上完成 TLS + HTTPS 请求。效果等同 `ssh -D` 的 SOCKS 隧道，
 * 但由插件内置、随用随连，不需要用户挂着终端，服务器端也零配置（OpenSSH 默认允许 TCP 转发）。
 *
 * 微信 IP 白名单只校验「获取 access_token」接口，所以默认只有 token 请求走隧道，上传与草稿直连；
 * client.js 另有保险：非 token 请求若意外返回 40164，会改走隧道重试一次。
 *
 * 安全：首次连接记录服务器主机密钥指纹（TOFU），之后指纹变化即拒绝，防止中间人。
 * ssh2 为纯 JS 实现（可选的原生加速模块在打包时标为 external，缺失时自动回退）。 */

const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { t } = require('../i18n');
const { tlsOverSocket, httpsOverSocket, abortError } = require('../net/socket-https');

const DEFAULT_PORT = 22;
const READY_TIMEOUT = 20000;
function expandHome(p) { return String(p).replace(/^~(?=$|\/)/, os.homedir()); }
function looksLikeKeyText(value) { return /^-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value) || /^PuTTY-User-Key-File/i.test(value); }

/* OpenSSH 风格指纹：SHA256:<base64 去掉填充> */
function fingerprintOf(key) {
  return 'SHA256:' + crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
}

/* 设置 + 密钥串内容 → ssh2 connect 配置。privateKey 可以是 PEM/OpenSSH/PuTTY 文本，也可以是文件路径。 */
function sshConnectConfig(raw) {
  const host = String(raw?.host || '').trim();
  if (!host) throw new Error(t('请填写 SSH 服务器地址'));
  const username = String(raw.username || '').trim();
  if (!username) throw new Error(t('请填写 SSH 用户名'));
  const port = raw.port === '' || raw.port == null ? DEFAULT_PORT : Number(raw.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(t('SSH 端口无效'));
  const config = { host, port, username, readyTimeout: READY_TIMEOUT, tryKeyboard: true };
  let privateKey = String(raw.privateKey || '').trim();
  if (privateKey && !looksLikeKeyText(privateKey)) {
    const file = expandHome(privateKey);
    try { privateKey = fs.readFileSync(file, 'utf8'); }
    catch (e) { throw new Error(t('无法读取私钥文件 {path}：{msg}', { path: file, msg: e.code || e.message })); }
  }
  if (privateKey) { config.privateKey = privateKey; if (raw.passphrase) config.passphrase = String(raw.passphrase); }
  if (raw.password) config.password = String(raw.password);
  if (!config.privateKey && !config.password) throw new Error(t('请提供 SSH 密码或私钥'));
  return config;
}

function friendlyError(e, config, seen, expected) {
  const msg = String(e?.message || e || '');
  if (/Host denied|verification failed/i.test(msg) || e?.code === 'HOST_KEY_MISMATCH') {
    const err = new Error(t('服务器指纹变化：记录的是 {expected}，本次为 {actual}。若服务器确实重装过，请在设置中重置指纹后重试', { expected: expected || '-', actual: seen || '-' }));
    err.code = 'HOST_KEY_MISMATCH'; return err;
  }
  if (e?.level === 'client-authentication' || /authentication methods failed/i.test(msg)) return new Error(t('SSH 认证失败：请检查用户名、密码或私钥'));
  if (/Cannot parse privateKey|Malformed|Encrypted private key detected|bad passphrase|no passphrase/i.test(msg)) return new Error(t('私钥无法解析或口令不正确'));
  if (/Timed out while waiting for handshake/i.test(msg)) return new Error(t('SSH 握手超时，请检查地址、端口与网络'));
  if (/administratively prohibited|open failed|Channel open failure/i.test(msg)) return new Error(t('服务器禁止了端口转发（sshd 的 AllowTcpForwarding），请允许转发或换一个账号'));
  if (e?.code && /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH|ECONNRESET|EAI_AGAIN/.test(e.code)) return new Error(t('无法连接 SSH 服务器 {host}:{port}（{code}）', { host: config.host, port: config.port, code: e.code }));
  return new Error(t('SSH 连接失败：') + msg);
}

/* 建立 SSH 连接；hostVerifier 做 TOFU 校验。resolve 时附带本次指纹，供调用方首次持久化。 */
function connect(raw, signal) {
  const config = sshConnectConfig(raw);
  const { Client } = require('ssh2');
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const client = new Client(); let seen = '', settled = false;
    const finish = (error, result) => { if (settled) return; settled = true; signal?.removeEventListener('abort', stop); error ? reject(error) : resolve(result); };
    const stop = () => { client.end(); finish(abortError()); };
    const expected = String(raw.hostKeyFingerprint || '').trim();
    client.on('keyboard-interactive', (name, instructions, lang, prompts, done) => done(prompts.map(() => config.password || '')));
    client.on('ready', () => finish(null, { client, fingerprint: seen }));
    client.on('error', e => { client.end(); finish(friendlyError(e, config, seen, expected)); });
    signal?.addEventListener('abort', stop, { once: true });
    try {
      client.connect({ ...config, hostVerifier: key => { seen = fingerprintOf(key); return !expected || seen === expected; } });
    } catch (e) { finish(friendlyError(e, config, seen, expected)); }
  });
}

function forwardOut(client, host, port) {
  return new Promise((resolve, reject) => {
    client.forwardOut('127.0.0.1', 0, host, port, (e, channel) => e ? reject(e) : resolve(channel));
  });
}

/* 经 SSH 隧道发一次 HTTPS 请求。options.tls 仅供测试注入自签名 CA；返回体附带 hostKeyFingerprint。 */
async function tunnelRequest(raw, url, options = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:') throw new Error(t('隧道只支持 HTTPS 地址'));
  const { client, fingerprint } = await connect(raw, options.signal);
  try {
    const channel = await forwardOut(client, target.hostname, Number(target.port) || 443).catch(e => { throw friendlyError(e, { host: raw.host, port: raw.port }, fingerprint, raw.hostKeyFingerprint); });
    const socket = await tlsOverSocket(channel, options.tls?.servername || target.hostname, options.tls);
    const response = await httpsOverSocket(socket, target, options);
    response.hostKeyFingerprint = fingerprint;
    return response;
  } finally { client.end(); }
}

/* 设置页「测试 SSH 连接」：连接 + 试开一条到微信的转发通道（提前暴露 AllowTcpForwarding 问题）。 */
async function testConnection(raw, signal) {
  const { client, fingerprint } = await connect(raw, signal);
  try {
    const channel = await forwardOut(client, 'api.weixin.qq.com', 443).catch(e => { throw friendlyError(e, { host: raw.host, port: raw.port }, fingerprint, raw.hostKeyFingerprint); });
    channel.destroy();
    return { fingerprint };
  } finally { client.end(); }
}

module.exports = { sshConnectConfig, fingerprintOf, looksLikeKeyText, tunnelRequest, testConnection, friendlyError, DEFAULT_PORT };

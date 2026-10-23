'use strict';
/* Private, single-owner relay. Each installation is one isolated workspace.
 * Run behind HTTPS; browser session cookies and platform tokens never belong here. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const random = () => crypto.randomBytes(32).toString('base64url');
const issue = (status, message) => Object.assign(new Error(message), { status });
const MAX_BODY = 33 * 1024 * 1024;
const TERMINAL = new Set(['draft_saved', 'failed', 'needs_review', 'uncertain', 'expired']);

function validatePacket(packet) {
  if (packet?.version !== 1 || packet.kind !== 'banana.article' || !/^[\w-]{16,80}$/.test(packet.requestId || '') || !/^[a-f0-9]{64}$/.test(packet.snapshotHash || '') || !packet.article?.title || typeof packet.article.html !== 'string' || !Array.isArray(packet.assets) || packet.assets.length > 100) throw issue(400, '文章快照不完整');
  if (Buffer.byteLength(JSON.stringify(packet)) > 32 * 1024 * 1024) throw issue(413, '文章快照过大');
  const ids = new Set();
  for (const asset of packet.assets) {
    if (!/^[\w-]{1,100}$/.test(asset.id || '') || ids.has(asset.id) || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.mime) || typeof asset.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.base64)) throw issue(400, '附件格式不正确');
    const bytes = Buffer.from(asset.base64, 'base64');
    if (!bytes.length || bytes.length > 12 * 1024 * 1024 || bytes.length !== asset.bytes || digest(bytes) !== asset.sha256) throw issue(400, '附件校验失败');
    ids.add(asset.id);
  }
  if (!ids.has(packet.article.coverAssetId)) throw issue(400, '公众号草稿需要封面');
  for (const match of packet.article.html.matchAll(/banana-asset:\/\/([\w-]+)/g)) if (!ids.has(match[1])) throw issue(400, '正文图片缺失');
  if (digest(JSON.stringify({ article: packet.article, assets: packet.assets.map(({ id, mime, sha256 }) => ({ id, mime, sha256 })) })) !== packet.snapshotHash) throw issue(400, '文章快照校验失败');
}

async function createRelay({ directory, adminToken, now = Date.now, leaseMs = 5 * 60_000, retentionMs = 7 * 86400_000, maxJobs = 40 } = {}) {
  if (!adminToken || adminToken.length < 24) throw new Error('BANANA_RELAY_ADMIN_TOKEN 需至少 24 字符');
  if (!directory) throw new Error('缺少任务存储目录');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, 'state.json');
  const packetsDirectory = path.join(directory, 'packets');
  await fs.mkdir(packetsDirectory, { recursive: true, mode: 0o700 });
  let state;
  try { state = JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = { version: 2, devices: [], pairing: [], jobs: [] }; }
  if (state.version !== 2 || !['devices', 'pairing', 'jobs'].every(key => Array.isArray(state[key]))) throw new Error('任务存储格式不正确，未覆盖原文件');
  let serial = Promise.resolve();
  const packetFile = id => path.join(packetsDirectory, id + '.json');
  async function savePacket(id, packet) {
    await fs.writeFile(packetFile(id) + '.tmp', JSON.stringify(packet), { mode: 0o600 });
    await fs.rename(packetFile(id) + '.tmp', packetFile(id));
  }
  async function cleanupPackets() {
    const retained = new Set(state.jobs.filter(job => job.hasPacket).map(job => job.id + '.json'));
    for (const name of await fs.readdir(packetsDirectory)) {
      if (/^[a-f0-9-]{36}\.json(?:\.tmp)?$/.test(name) && !retained.has(name)) {
        await fs.unlink(path.join(packetsDirectory, name)).catch(error => { if (error.code !== 'ENOENT') console.error('Relay packet cleanup failed'); });
      }
    }
  }
  async function save() {
    const temp = filename + '.tmp';
    await fs.writeFile(temp, JSON.stringify(state), { mode: 0o600 });
    await fs.rename(temp, filename);
  }
  function transaction(fn) {
    const task = serial.then(async () => {
      const previous = structuredClone(state);
      try { const result = await fn(); await save(); await cleanupPackets().catch(() => console.error('Relay packet cleanup failed')); return result; }
      catch (error) { state = previous; throw error; }
    });
    serial = task.catch(() => {}); return task;
  }
  function sweep() {
    state.pairing = state.pairing.filter(item => item.expiresAt > now());
    for (const job of state.jobs) {
      if (job.expiresAt <= now()) { job.status = 'expired'; delete job.hasPacket; delete job.leaseId; }
      else if (job.leaseUntil && job.leaseUntil < now()) {
        if (job.status === 'claimed') { job.status = 'queued'; delete job.leaseId; }
        else if (job.status === 'processing') { job.status = 'uncertain'; job.error = '浏览器执行中断，请先检查草稿箱；未自动重试'; }
      }
    }
    state.jobs = state.jobs.filter(job => job.expiresAt + 86400_000 > now());
  }
  function publicJob(job) {
    const { hasPacket, leaseId, leaseUntil, ...summary } = job;
    return summary;
  }
  function authenticate(req) {
    const token = String(req.headers.authorization || '').match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw issue(401, '需要设备授权');
    const hashed = digest(token);
    if (crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(digest(adminToken)))) return { role: 'admin' };
    const device = state.devices.find(item => item.tokenHash === hashed && !item.revoked);
    if (!device) throw issue(401, '设备授权已失效');
    return device;
  }
  async function readBody(req, limit = MAX_BODY) {
    if (Number(req.headers['content-length']) > limit) throw issue(413, '请求过大');
    const chunks = []; let length = 0;
    for await (const chunk of req) { length += chunk.length; if (length > limit) throw issue(413, '请求过大'); chunks.push(chunk); }
    try {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid object');
      return body;
    }
    catch { throw issue(400, '请求不是有效 JSON'); }
  }
  async function route(req, body, url) {
    sweep();
    if (req.method === 'GET' && url.pathname === '/health') return { service: 'banana-publish-relay', version: 1 };
    if (req.method === 'POST' && url.pathname === '/v1/pair') {
      const index = state.pairing.findIndex(item => item.codeHash === digest(String(body.code || '')));
      if (index < 0) throw issue(403, '配对码无效或已过期');
      const pairing = state.pairing.splice(index, 1)[0], token = random();
      const device = { id: crypto.randomUUID(), role: pairing.role, label: pairing.label, tokenHash: digest(token), lastSeenAt: now() };
      state.devices.push(device);
      return { device: { id: device.id, role: device.role, label: device.label }, token };
    }
    const actor = authenticate(req); if (actor.role !== 'admin') actor.lastSeenAt = now();
    const requireRole = role => { if (actor.role !== role) throw issue(403, '设备无此权限'); };
    if (req.method === 'POST' && url.pathname === '/v1/pairing') {
      requireRole('admin');
      if (!['producer', 'browser'].includes(body.role) || !String(body.label || '').trim()) throw issue(400, '指定设备类型与名称');
      const code = random(); state.pairing.push({ codeHash: digest(code), role: body.role, label: String(body.label).slice(0, 80), expiresAt: now() + 10 * 60_000 });
      return { code, expiresIn: 600 };
    }
    if (req.method === 'GET' && url.pathname === '/v1/devices') {
      if (!['admin', 'producer'].includes(actor.role)) throw issue(403, '设备无此权限');
      return { devices: state.devices.filter(item => item.role === 'browser' && !item.revoked).map(({ id, label, lastSeenAt }) => ({ id, label, lastSeenAt })) };
    }
    const revoke = url.pathname.match(/^\/v1\/devices\/([\w-]+)\/revoke$/);
    if (req.method === 'POST' && revoke) { requireRole('admin'); const device = state.devices.find(item => item.id === revoke[1]); if (!device) throw issue(404, '设备不存在'); device.revoked = true; return { revoked: true }; }
    if (req.method === 'POST' && url.pathname === '/v1/jobs') {
      requireRole('producer'); validatePacket(body.packet);
      if (body.target !== 'wechat' || !state.devices.some(item => item.id === body.deviceId && item.role === 'browser' && !item.revoked)) throw issue(400, '请选择已配对的目标浏览器');
      const existing = state.jobs.find(item => item.producerId === actor.id && item.requestId === body.packet.requestId);
      if (existing) {
        if (existing.snapshotHash !== body.packet.snapshotHash || existing.deviceId !== body.deviceId) throw issue(409, '同一任务 ID 的内容或目标不一致');
        if (body.retry === true && ['failed', 'needs_review'].includes(existing.status)) {
          if (state.jobs.filter(item => item.hasPacket).length >= maxJobs) throw issue(429, '任务存储已满，请稍后重试');
          await savePacket(existing.id, body.packet);
          existing.hasPacket = true; existing.status = 'queued'; existing.expiresAt = now() + retentionMs;
          delete existing.error; delete existing.finishedAt;
        }
        return { job: publicJob(existing) };
      }
      if (state.jobs.filter(item => item.hasPacket).length >= maxJobs) throw issue(429, '任务存储已满，请清理或等待过期');
      const job = { id: crypto.randomUUID(), requestId: body.packet.requestId, snapshotHash: body.packet.snapshotHash, producerId: actor.id, deviceId: body.deviceId, target: 'wechat', title: String(body.packet.article.title).slice(0, 200), hasPacket: true, status: 'queued', createdAt: now(), expiresAt: now() + retentionMs };
      await savePacket(job.id, body.packet);
      state.jobs.push(job); return { job: publicJob(job) };
    }
    if (req.method === 'POST' && url.pathname === '/v1/jobs/claim') {
      requireRole('browser'); const job = state.jobs.find(item => item.deviceId === actor.id && item.status === 'queued');
      if (!job) return { job: null };
      let packet;
      try {
        packet = JSON.parse(await fs.readFile(packetFile(job.id), 'utf8')); validatePacket(packet);
        if (packet.snapshotHash !== job.snapshotHash || packet.requestId !== job.requestId) throw new Error('snapshot mismatch');
      }
      catch { job.status = 'failed'; job.error = '服务器文章快照缺失或损坏，请重新发送'; delete job.hasPacket; return { job: null }; }
      job.status = 'claimed'; job.leaseId = random(); job.leaseUntil = now() + leaseMs;
      return { job: { ...publicJob(job), packet, leaseId: job.leaseId } };
    }
    const match = url.pathname.match(/^\/v1\/jobs\/([\w-]+)(?:\/(start|lease|result))?$/);
    if (!match) throw issue(404, '接口不存在');
    const job = state.jobs.find(item => item.id === match[1]);
    if (!job || (actor.role === 'producer' && job.producerId !== actor.id) || (actor.role === 'browser' && job.deviceId !== actor.id)) throw issue(404, '任务不存在');
    if (req.method === 'GET' && !match[2]) return { job: publicJob(job) };
    requireRole('browser');
    if (req.method !== 'POST' || !job.leaseId || body.leaseId !== job.leaseId) throw issue(409, '任务执行权已失效');
    if (match[2] === 'start') {
      if (job.status !== 'claimed') throw issue(409, '此任务不能再次执行');
      job.status = 'processing'; job.leaseUntil = now() + leaseMs;
    } else if (match[2] === 'lease') {
      if (job.status !== 'processing') throw issue(409, '此任务已停止执行');
      job.leaseUntil = now() + leaseMs;
    } else if (match[2] === 'result') {
      if (!['processing', 'uncertain'].includes(job.status) || !TERMINAL.has(body.status) || body.status === 'expired') throw issue(409, '任务结果不适用');
      if (body.status === 'draft_saved') {
        const draft = new URL(String(body.url || ''));
        if (draft.origin !== 'https://mp.weixin.qq.com' || draft.pathname !== '/cgi-bin/appmsg' || !/^\d+$/.test(draft.searchParams.get('appmsgid') || '')) throw issue(400, '草稿链接不正确');
        // Never retain browser login tokens in the relay.
        job.url = 'https://mp.weixin.qq.com/cgi-bin/appmsg?' + new URLSearchParams({ t: 'media/appmsg_edit', action: 'edit', type: '77', appmsgid: draft.searchParams.get('appmsgid') });
      }
      job.status = body.status; job.error = String(body.error || '').slice(0, 300); job.finishedAt = now();
      delete job.hasPacket; delete job.leaseId; delete job.leaseUntil;
    } else throw issue(404, '接口不存在');
    return { job: publicJob(job) };
  }
  const server = http.createServer(async (req, res) => {
    const respond = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    try {
      if (req.method === 'OPTIONS') throw issue(403, '不提供网页跨域接口');
      const url = new URL(req.url, 'http://relay.invalid');
      if (req.method === 'GET' && url.pathname === '/health') { respond(200, { service: 'banana-publish-relay', version: 1 }); return; }
      // Authenticate before buffering large article bodies. Pairing requests are separately limited.
      if (url.pathname !== '/v1/pair' && url.pathname !== '/health') authenticate(req);
      if (url.pathname === '/v1/pair' && Number(req.headers['content-length']) > 4096) throw issue(413, '配对请求过大');
      const body = await readBody(req, ['/v1/pair', '/health'].includes(url.pathname) ? 4096 : MAX_BODY);
      const result = await transaction(() => route(req, body, url));
      respond(200, result);
    } catch (error) { respond(error.status || 500, { error: error.status ? error.message : '服务器处理失败；请查询任务状态后再重试' }); }
  });
  server.requestTimeout = 60_000; server.headersTimeout = 15_000;
  const cleanup = setInterval(() => transaction(sweep).catch(() => {}), 60_000); cleanup.unref();
  server.on('close', () => clearInterval(cleanup));
  await transaction(sweep);
  return server;
}

if (require.main === module) {
  createRelay({ directory: process.env.BANANA_RELAY_DATA || path.join(os.homedir(), '.local/share/banana-publish-relay'), adminToken: process.env.BANANA_RELAY_ADMIN_TOKEN }).then(server => {
    server.listen(Number(process.env.PORT || 39281), process.env.HOST || '127.0.0.1', () => console.log('Banana publish relay ready; place behind HTTPS for remote devices.'));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createRelay, validatePacket };

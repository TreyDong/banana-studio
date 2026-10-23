'use strict';
// Independently implemented companion. Platform session data stays in this browser.
function relayOrigin(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error('请填写服务器根地址');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('跨设备连接需要 HTTPS');
  return url.origin;
}

// Executed in the WeChat page, not in the relay. Do not log or return login tokens.
async function createWechatDraft(packet) {
  let creating = false;
  try {
    const home = await fetch('/', { credentials: 'include', signal: AbortSignal.timeout(20_000) });
    const text = await home.text();
    const common = globalThis.wx?.commonData || {};
    const field = name => text.match(new RegExp('(?:["\']?' + name + '["\']?)\\s*:\\s*["\']([^"\']+)["\']'))?.[1] || '';
    const token = String(common.t || new URL(home.url).searchParams.get('token') || field('t') || '');
    const ticket = common.ticket || field('ticket'), username = common.user_name || field('user_name');
    if (!/^\d+$/.test(token) || !ticket || !username) return { status: 'needs_review', error: '请在本浏览器登录公众号后重新发送；未创建草稿' };
    if (packet?.version !== 1 || !Array.isArray(packet.assets) || !packet.article?.coverAssetId) throw new Error('文章或封面不完整');
    const uploaded = new Map();
    for (const asset of packet.assets) {
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(asset.mime)) throw new Error('请先将图片转成 PNG、JPEG 或 GIF');
      const bytes = Uint8Array.from(atob(asset.base64), c => c.charCodeAt(0));
      const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
      if (checksum !== asset.sha256 || bytes.length !== asset.bytes) throw new Error('图片数据校验失败');
      const blob = new Blob([bytes], { type: asset.mime });
      const bitmap = await createImageBitmap(blob); bitmap.close();
      const form = new FormData();
      form.set('type', asset.mime); form.set('id', crypto.randomUUID()); form.set('name', asset.fileName); form.set('size', String(bytes.length)); form.set('file', blob, asset.fileName);
      const upload = new URL('/cgi-bin/filetransfer', location.origin);
      upload.search = new URLSearchParams({ action: 'upload_material', f: 'json', scene: '8', writetype: 'doublewrite', groupid: '1', ticket_id: username, ticket, token, lang: 'zh_CN', svr_time: String(Math.floor(Date.now() / 1000)), seq: String(Date.now()) });
      const response = await fetch(upload, { method: 'POST', credentials: 'include', body: form, signal: AbortSignal.timeout(45_000) });
      const result = await response.json();
      if (!response.ok || Number(result.base_resp?.ret) !== 0 || !result.cdn_url || !/^\d+$/.test(String(result.content))) throw new Error('公众号图片上传未成功；请检查登录与素材权限');
      const imageUrl = new URL(result.cdn_url);
      if (!['https:', 'http:'].includes(imageUrl.protocol)) throw new Error('公众号返回的图片地址无效');
      uploaded.set(asset.id, { url: imageUrl.href, fileId: String(result.content) });
    }
    const cover = uploaded.get(packet.article.coverAssetId);
    if (!cover) throw new Error('封面未上传');
    const documentCopy = new DOMParser().parseFromString(packet.article.html, 'text/html');
    for (const node of documentCopy.querySelectorAll('script,iframe,object,embed,form,input,button,meta,link,base,svg,math')) node.remove();
    for (const node of documentCopy.querySelectorAll('*')) {
      for (const attribute of Array.from(node.attributes)) {
        if (/^on/i.test(attribute.name) || /^(?:javascript|vbscript|file|app):/i.test(attribute.value.trim())) node.removeAttribute(attribute.name);
      }
    }
    for (const image of documentCopy.querySelectorAll('img')) {
      const source = image.getAttribute('src') || '';
      if (source.startsWith('banana-asset://')) {
        const asset = uploaded.get(source.slice('banana-asset://'.length));
        if (!asset) throw new Error('正文图片未上传');
        image.setAttribute('src', asset.url);
      } else if (!/^https?:\/\//i.test(source)) throw new Error('正文仍有浏览器无法读取的图片');
    }
    const form = new FormData();
    const fields = {
      token, lang: 'zh_CN', f: 'json', ajax: '1', AppMsgId: '', count: '1', data_seq: '0', operate_from: 'Chrome', isnew: '0',
      title0: packet.article.title, author0: packet.article.author || '', writerid0: '0', fileid0: cover.fileId,
      digest0: (packet.article.digest || '').slice(0, 120), auto_gen_digest0: packet.article.digest ? '0' : '1',
      content0: documentCopy.body.innerHTML, sourceurl0: '', need_open_comment0: '0', only_fans_can_comment0: '0',
      cdn_url0: cover.url, cdn_235_1_url0: cover.url, show_cover_pic0: '0', copyright_type0: '0',
      can_reward0: '0', fee0: '0', share_page_type0: '0', share_imageinfo0: '{"list":[]}', dot0: '{}', categories_list0: '[]', compose_info0: '{"list":""}'
    };
    for (const [key, value] of Object.entries(fields)) form.set(key, String(value));
    const endpoint = new URL('/cgi-bin/operate_appmsg', location.origin);
    endpoint.search = new URLSearchParams({ t: 'ajax-response', sub: 'create', type: '77', token, lang: 'zh_CN' });
    creating = true; // From here, a lost response must never trigger automatic re-creation.
    const response = await fetch(endpoint, { method: 'POST', credentials: 'include', body: form, signal: AbortSignal.timeout(45_000) });
    const result = await response.json();
    const id = String(result.appMsgId || '');
    if (!/^\d+$/.test(id)) {
      if (Number.isFinite(result.base_resp?.ret) && result.base_resp.ret !== 0) return { status: 'failed', error: '公众号拒绝创建草稿（代码 ' + result.base_resp.ret + '）' };
      return { status: 'uncertain', error: '未得到明确草稿编号，请先检查公众号草稿箱；未自动重试' };
    }
    const url = new URL('/cgi-bin/appmsg', location.origin);
    url.search = new URLSearchParams({ t: 'media/appmsg_edit', action: 'edit', type: '77', appmsgid: id });
    const safeUrl = url.href; url.searchParams.set('token', token);
    return { status: 'draft_saved', url: safeUrl, openUrl: url.href };
  } catch {
    return { status: creating ? 'uncertain' : 'failed', error: creating ? '创建草稿时连接中断，请先检查草稿箱；未自动重试' : '图片或文章处理失败；请检查素材格式、登录状态及后台权限' };
  }
}

async function extensionRequest(config, route, body) {
  const response = await fetch(config.server + route, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + config.token, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '服务器请求失败');
  return result;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const status = document.getElementById('status'), enabled = document.getElementById('enabled');
    const { config, lastStatus } = await chrome.storage.local.get(['config', 'lastStatus']);
    document.getElementById('server').value = config?.server || ''; enabled.checked = !!config?.enabled;
    enabled.disabled = !config?.token; status.textContent = lastStatus || (config ? '已连接：' + config.label : '尚未连接');
    enabled.onchange = async () => {
      const { config: current } = await chrome.storage.local.get('config');
      if (!current) return;
      await chrome.storage.local.set({ config: { ...current, enabled: enabled.checked } });
      chrome.runtime.sendMessage({ action: 'poll' });
    };
    document.getElementById('pair-form').onsubmit = async event => {
      event.preventDefault(); const button = document.getElementById('pair');
      try {
        button.disabled = true;
        const server = relayOrigin(document.getElementById('server').value.trim());
        if (!(await chrome.permissions.request({ origins: [server + '/*'] }))) throw new Error('需要允许连接这台服务器');
        const response = await fetch(server + '/v1/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: document.getElementById('code').value.trim() }), signal: AbortSignal.timeout(15_000) });
        const result = await response.json();
        if (!response.ok || result.device?.role !== 'browser' || !result.token) throw new Error(result.error || '请使用浏览器设备配对码');
        await chrome.storage.local.set({ config: { server, token: result.token, deviceId: result.device.id, label: result.device.label, enabled: false } });
        await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
        document.getElementById('code').value = ''; enabled.disabled = false; enabled.checked = false;
        status.textContent = '已连接：' + result.device.label + '。勾选上方选项后开始领取任务。';
      } catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    };
  });
} else if (typeof chrome !== 'undefined') {
  let polling = false;
  const showStatus = lastStatus => chrome.storage.local.set({ lastStatus });
  async function poll() {
    if (polling) return; polling = true;
    let leaseTimer;
    try {
      const { config, current } = await chrome.storage.local.get(['config', 'current']);
      if (!config?.token || !config.enabled) return;
      if (current) {
        if (current.server !== config.server || current.deviceId !== config.deviceId) { await showStatus('有旧设备未确认任务，请先恢复原连接并检查草稿箱'); return; }
        const { job } = await extensionRequest(config, '/v1/jobs/' + current.id);
        if (['queued', 'claimed', 'processing'].includes(job.status)) {
          // Never resume an interrupted platform action. Preserve a definite result if available.
          if (job.status === 'processing') await extensionRequest(config, '/v1/jobs/' + current.id + '/result', { leaseId: current.leaseId, ...(current.result || { status: 'uncertain', error: '扩展执行中断，请先检查草稿箱；未自动重试' }) });
          else if (job.status === 'claimed') { await showStatus('等待旧任务执行权到期后重新领取'); return; }
        }
        if (job.status === 'uncertain' && current.result) await extensionRequest(config, '/v1/jobs/' + current.id + '/result', { leaseId: current.leaseId, ...current.result });
        await chrome.storage.local.remove('current');
      }
      const { job } = await extensionRequest(config, '/v1/jobs/claim', {});
      if (!job) return;
      await chrome.storage.local.set({ current: { id: job.id, leaseId: job.leaseId, server: config.server, deviceId: config.deviceId } });
      await extensionRequest(config, '/v1/jobs/' + job.id + '/start', { leaseId: job.leaseId });
      await showStatus('正在创建草稿：' + job.title);
      leaseTimer = setInterval(() => extensionRequest(config, '/v1/jobs/' + job.id + '/lease', { leaseId: job.leaseId }).catch(() => {}), 20_000);
      const tab = await chrome.tabs.create({ url: 'https://mp.weixin.qq.com/', active: true });
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        const target = await chrome.tabs.get(tab.id);
        if (target.status === 'complete') { ready = true; break; }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (!ready) throw new Error('公众号页面未加载完成');
      const executed = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: createWechatDraft, args: [job.packet] });
      const result = executed[0]?.result || { status: 'uncertain', error: '浏览器未返回明确结果，请检查草稿箱' };
      const { openUrl, ...receipt } = result;
      await chrome.storage.local.set({ current: { id: job.id, leaseId: job.leaseId, server: config.server, deviceId: config.deviceId, result: receipt } });
      await extensionRequest(config, '/v1/jobs/' + job.id + '/result', { leaseId: job.leaseId, ...receipt });
      await chrome.storage.local.remove('current');
      await showStatus(receipt.status === 'draft_saved' ? '草稿已创建，请检查封面、图片与排版' : receipt.error);
      if (openUrl) await chrome.tabs.update(tab.id, { url: openUrl });
    } catch (error) { await showStatus(error.message || '连接失败，下次检查时继续核对任务'); }
    finally { clearInterval(leaseTimer); polling = false; }
  }
  const wake = () => { chrome.alarms.create('banana-relay', { periodInMinutes: 0.5 }); poll(); };
  chrome.runtime.onInstalled.addListener(wake); chrome.runtime.onStartup.addListener(wake);
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'banana-relay') poll(); });
  chrome.runtime.onMessage.addListener((message, sender) => { if (sender.id === chrome.runtime.id && message.action === 'poll') poll(); });
}
if (typeof module !== 'undefined') module.exports = { relayOrigin, createWechatDraft };

'use strict';
const { t } = require('../i18n');
// Provider presets adapted from the installed Qiaomu Design 0.3.0.
const TEXT_PROVIDERS = [
  {
    "id": "chatgpt",
    "name": "ChatGPT",
    "group": "account",
    "sub": "通过本机 Codex 的 ChatGPT 登录",
    "protocol": "codex",
    "baseUrl": "",
    "models": [],
    "keyless": true
  },
  {
    "id": "magpie",
    "name": "Magpie",
    "group": "local",
    "sub": "Claude Codex Copilot Kimi Qoder ZCode WorkBuddy Trae MiniMax MiMo",
    "protocol": "openai",
    "baseUrl": "http://127.0.0.1:3425/v1",
    "keyless": true,
    "models": []
  },
  {
    "id": "glm-coding",
    "name": "智谱 GLM · Coding Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
    "keyUrl": "https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys",
    "models": []
  },
  {
    "id": "zai-coding",
    "name": "Z.ai · Coding Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://api.z.ai/api/coding/paas/v4",
    "keyUrl": "https://z.ai/manage-apikey/apikey-list",
    "models": []
  },
  {
    "id": "kimi-code",
    "name": "Kimi Code · 国内套餐",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://api.kimi.com/coding/v1",
    "keyUrl": "https://www.kimi.com/code/console",
    "models": []
  },
  {
    "id": "minimax-plan",
    "name": "MiniMax · Token Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://api.minimaxi.com/v1",
    "keyUrl": "https://platform.minimaxi.com/subscribe/coding-plan",
    "models": []
  },
  {
    "id": "bailian-plan",
    "name": "百炼 · Token Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "keyUrl": "https://bailian.console.aliyun.com/cn-beijing/subscription/token-plan/personal",
    "models": []
  },
  {
    "id": "mimo-plan",
    "name": "小米 MiMo · Token Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
    "keyUrl": "https://platform.xiaomimimo.com/token-plan",
    "models": []
  },
  {
    "id": "doubao-coding",
    "name": "火山方舟 · Coding Plan",
    "group": "plan",
    "sub": "Coding / Token Plan",
    "protocol": "openai",
    "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
    "keyUrl": "https://console.volcengine.com/ark",
    "models": []
  },
  {
    "id": "codex",
    "name": "Codex CLI",
    "group": "account",
    "sub": "ChatGPT 账号，免密钥",
    "protocol": "codex",
    "baseUrl": "",
    "keyless": true,
    "models": []
  },
  {
    "id": "tokendance",
    "name": "词元跳动",
    "group": "provider",
    "sub": "TokenDance · tokendance.space",
    "protocol": "openai",
    "baseUrl": "https://tokendance.space/gateway/v1",
    "keyUrl": "https://tokendance.space/keys",
    "models": []
  },
  {
    "id": "deepseek",
    "name": "DeepSeek",
    "group": "provider",
    "sub": "api.deepseek.com",
    "protocol": "openai",
    "baseUrl": "https://api.deepseek.com/v1",
    "keyUrl": "https://platform.deepseek.com/api_keys",
    "models": [
      {
        "id": "deepseek-chat"
      },
      {
        "id": "deepseek-reasoner"
      }
    ]
  },
  {
    "id": "openai",
    "name": "OpenAI",
    "group": "provider",
    "sub": "api.openai.com",
    "protocol": "openai",
    "baseUrl": "https://api.openai.com/v1",
    "keyUrl": "https://platform.openai.com/api-keys",
    "models": [
      {
        "id": "gpt-4.1-mini"
      },
      {
        "id": "gpt-4.1"
      },
      {
        "id": "o4-mini"
      }
    ]
  },
  {
    "id": "anthropic",
    "name": "Anthropic Claude",
    "group": "provider",
    "sub": "api.anthropic.com",
    "protocol": "anthropic",
    "baseUrl": "https://api.anthropic.com",
    "keyUrl": "https://console.anthropic.com/settings/keys",
    "models": [
      {
        "id": "claude-sonnet-5-5"
      },
      {
        "id": "claude-haiku-5-5"
      },
      {
        "id": "claude-opus-5-5"
      }
    ]
  },
  {
    "id": "gemini",
    "name": "Google Gemini",
    "group": "provider",
    "sub": "generativelanguage.googleapis.com",
    "protocol": "openai",
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai",
    "keyUrl": "https://aistudio.google.com/apikey",
    "models": [
      {
        "id": "gemini-2.5-flash"
      },
      {
        "id": "gemini-2.5-pro"
      }
    ]
  },
  {
    "id": "doubao",
    "name": "豆包 · 火山方舟",
    "group": "provider",
    "sub": "ark.cn-beijing.volces.com",
    "protocol": "openai",
    "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
    "keyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    "models": [
      {
        "id": "doubao-seed-1-6-250615"
      }
    ]
  },
  {
    "id": "moonshot",
    "name": "Kimi · Moonshot",
    "group": "provider",
    "sub": "api.moonshot.cn",
    "protocol": "openai",
    "baseUrl": "https://api.moonshot.cn/v1",
    "keyUrl": "https://platform.moonshot.cn/console/api-keys",
    "models": [
      {
        "id": "kimi-latest"
      },
      {
        "id": "moonshot-v1-8k"
      }
    ]
  },
  {
    "id": "zhipu",
    "name": "智谱 GLM",
    "group": "provider",
    "sub": "open.bigmodel.cn",
    "protocol": "openai",
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
    "keyUrl": "https://open.bigmodel.cn/usercenter/apikeys",
    "models": [
      {
        "id": "glm-4-plus"
      },
      {
        "id": "glm-4-flash"
      }
    ]
  },
  {
    "id": "qwen",
    "name": "通义千问 · 百炼",
    "group": "provider",
    "sub": "dashscope.aliyuncs.com",
    "protocol": "openai",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "keyUrl": "https://bailian.console.aliyun.com/?apiKey=1",
    "models": [
      {
        "id": "qwen-plus"
      },
      {
        "id": "qwen-max"
      }
    ]
  },
  {
    "id": "siliconflow",
    "name": "SiliconFlow",
    "group": "provider",
    "sub": "api.siliconflow.cn",
    "protocol": "openai",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "keyUrl": "https://cloud.siliconflow.cn/account/ak",
    "models": [
      {
        "id": "Qwen/Qwen2.5-72B-Instruct"
      },
      {
        "id": "deepseek-ai/DeepSeek-V3"
      }
    ]
  },
  {
    "id": "openrouter",
    "name": "OpenRouter",
    "group": "provider",
    "sub": "openrouter.ai · 中转",
    "protocol": "openai",
    "baseUrl": "https://openrouter.ai/api/v1",
    "keyUrl": "https://openrouter.ai/keys",
    "models": [
      {
        "id": "google/gemini-2.5-flash"
      },
      {
        "id": "deepseek/deepseek-chat"
      },
      {
        "id": "openai/gpt-4.1-mini"
      }
    ]
  },
  {
    "id": "ollama",
    "name": "Ollama",
    "group": "local",
    "sub": "本机 localhost:11434",
    "protocol": "openai",
    "baseUrl": "http://localhost:11434/v1",
    "keyless": true,
    "models": [
      {
        "id": "qwen2.5:14b"
      }
    ]
  },
  {
    "id": "custom",
    "name": "自定义",
    "group": "custom",
    "sub": "OpenAI 兼容接口 / 自建中转",
    "protocol": "openai",
    "baseUrl": "",
    "models": []
  }
];
const IMAGE_PROVIDERS = [
  {
    "id": "codex",
    "name": "Codex CLI",
    "group": "account",
    "sub": "ChatGPT 账号，免密钥",
    "engine": "codex",
    "baseUrl": "",
    "keyless": true,
    "models": []
  },
  {
    "id": "ark",
    "name": "豆包 Seedream",
    "group": "provider",
    "sub": "火山方舟 · ark.cn-beijing.volces.com",
    "engine": "ark",
    "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
    "keyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    "models": [
      {
        "family": "5.0-pro",
        "id": "doubao-seedream-5-0-pro-260628",
        "name": "Seedream 5.0 Pro"
      },
      {
        "family": "5.0-flash",
        "id": "doubao-seedream-5-0-flash-260915",
        "name": "Seedream 5.0 Flash"
      },
      {
        "family": "5.0-lite",
        "id": "doubao-seedream-5-0-260128",
        "name": "Seedream 5.0 Lite"
      },
      {
        "family": "4.5",
        "id": "doubao-seedream-4-5-251128",
        "name": "Seedream 4.5"
      },
      {
        "family": "4.0",
        "id": "doubao-seedream-4-0-20260415",
        "name": "Seedream 4.0 (20260415)"
      },
      {
        "family": "3.0",
        "id": "doubao-seedream-3-0-t2i-250415",
        "name": "Seedream 3.0 (text to image)"
      },
      {
        "family": "4.0",
        "id": "doubao-seedream-4-0-250828",
        "name": "Seedream 4.0"
      }
    ]
  },
  {
    "id": "gemini",
    "name": "Google Gemini 生图",
    "group": "provider",
    "sub": "Nano Banana · generativelanguage.googleapis.com",
    "engine": "gemini",
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
    "keyUrl": "https://aistudio.google.com/apikey",
    "models": [
      {
        "id": "gemini-2.5-flash-image",
        "name": "Gemini 2.5 Flash Image"
      }
    ]
  },
  {
    "id": "openrouter",
    "name": "OpenRouter",
    "group": "provider",
    "sub": "openrouter.ai · 中转",
    "engine": "openrouter",
    "baseUrl": "https://openrouter.ai/api/v1",
    "keyUrl": "https://openrouter.ai/keys",
    "models": [
      {
        "id": "google/gemini-2.5-flash-image"
      },
      {
        "id": "bytedance-seed/seedream-4.5"
      }
    ]
  },
  {
    "id": "openai",
    "name": "OpenAI",
    "group": "provider",
    "sub": "api.openai.com",
    "engine": "api",
    "baseUrl": "https://api.openai.com/v1",
    "keyUrl": "https://platform.openai.com/api-keys",
    "models": [
      {
        "id": "gpt-image-1"
      }
    ]
  },
  {
    "id": "zhipu",
    "name": "智谱 CogView",
    "group": "provider",
    "sub": "open.bigmodel.cn",
    "engine": "api",
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
    "keyUrl": "https://open.bigmodel.cn/usercenter/apikeys",
    "models": [
      {
        "id": "cogview-4"
      }
    ]
  },
  {
    "id": "siliconflow",
    "name": "SiliconFlow",
    "group": "provider",
    "sub": "Qwen-Image / Kolors · api.siliconflow.cn",
    "engine": "api",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "keyUrl": "https://cloud.siliconflow.cn/account/ak",
    "models": [
      {
        "id": "Qwen/Qwen-Image", "name": "Qwen-Image"
      },
      { "id": "Qwen/Qwen-Image-Edit-2509", "name": "Qwen-Image Edit"
      },
      { "id": "Kwai-Kolors/Kolors", "name": "Kolors"
      }
    ]
  },
  {
    "id": "custom",
    "name": "自定义",
    "group": "custom",
    "sub": "OpenAI 兼容 /images/generations",
    "engine": "api",
    "baseUrl": "",
    "models": []
  }
];

const http = require('http'), https = require('https'), crypto = require('crypto');
const GROUPS = [['account','ChatGPT / Codex'],['plan','Coding 套餐'],['provider','API 服务商'],['local','本地服务'],['custom','自定义']];
function providers(kind) { return kind === 'image' ? IMAGE_PROVIDERS : TEXT_PROVIDERS; }
function preset(kind, id) { return providers(kind).find(p => p.id === id) || providers(kind).find(p => p.id === 'custom'); }
function abortError() { const e = new Error(t('已停止')); e.name = 'AbortError'; return e; }
function check(signal) { if (signal?.aborted) throw abortError(); }
function cleanURL(value) {
  const url = new URL(String(value).trim());
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(t('请填写 HTTP / HTTPS API 根地址，不包含密钥或查询参数'));
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error(t('远程 API 必须使用 HTTPS；仅本机服务可用 HTTP'));
  return url.href.replace(/\/+$/, '');
}
function endpoint(config, suffix) { const base = cleanURL(config.baseUrl); return base.endsWith('/' + suffix) ? base : base + '/' + suffix; }
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const {signal, timeout = 120000} = options;
    if (signal?.aborted) return reject(abortError());
    let req, settled = false, timer;
    const finish = (error, result) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', stop); error ? reject(error) : resolve(result); };
    const stop = () => { const e = abortError(); req?.destroy(e); finish(e); };
    try {
      const target = new URL(url); if (!['http:','https:'].includes(target.protocol)) throw new Error(t('返回的图片地址无效'));
      if (target.username || target.password || (target.protocol === 'http:' && !['localhost','127.0.0.1','[::1]'].includes(target.hostname))) throw new Error(t('网络地址必须使用 HTTPS；仅本机服务可用 HTTP'));
      const body = options.body != null ? Buffer.from(options.body) : options.json != null ? Buffer.from(JSON.stringify(options.json)) : null;
      const headers = { ...options.headers };
      if (options.json != null) headers['Content-Type'] = 'application/json';
      if (body) headers['Content-Length'] = body.length;
      req = (target.protocol === 'https:' ? https : http).request(target, { method: options.method || (body ? 'POST' : 'GET'), headers }, res => {
        const chunks = []; let length = 0;
        res.on('data', chunk => { length += chunk.length; if (length > 60 * 1024 * 1024) { const e = new Error(t('服务返回的图片过大')); req.destroy(e); finish(e); } else chunks.push(chunk); });
        res.on('error', e => finish(signal?.aborted ? abortError() : e));
        res.on('end', () => finish(null, { status: res.statusCode, headers: res.headers, buf: Buffer.concat(chunks) }));
      });
      req.on('error', e => finish(signal?.aborted ? abortError() : e));
      signal?.addEventListener('abort', stop, { once: true });
      timer = setTimeout(() => { const e = new Error(t('模型服务请求超时')); req.destroy(e); finish(e); }, timeout);
      if (body) req.write(body); req.end();
    } catch (e) { finish(e); }
  });
}
function serviceError(status, data, key) {
  let detail = data?.error?.message || data?.message || '';
  if (typeof detail !== 'string') detail = '';
  if (key) detail = detail.split(key).join('[密钥已隐藏]');
  const e = new Error('HTTP ' + status + (detail ? '：' + detail.slice(0, 450) : '')); e.status = status; return e;
}
async function jsonRequest(url, options, key = '') {
  const response = await request(url, options); check(options.signal);
  let data; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) { data = {}; }
  if (response.status < 200 || response.status >= 300) throw serviceError(response.status, data, key);
  return data;
}
function headers(config, key) {
  return config.protocol === 'anthropic' ? { ...(key ? {'x-api-key': key} : {}), 'anthropic-version': '2023-06-01' } : key ? { Authorization: 'Bearer ' + key } : {};
}
function validateConnection(kind, raw) {
  const provider = preset(kind, raw.provider);
  const config = { id: String(raw.id || crypto.randomUUID()), name: String(raw.name || provider.name).trim().slice(0, 80), provider: provider.id, baseUrl: String(raw.baseUrl ?? provider.baseUrl).trim(), model: String(raw.model || '').trim(), secretId: String(raw.secretId || ''), codexBin: String(raw.codexBin || '').trim(), models: Array.isArray(raw.models) ? raw.models.filter(m => m && typeof m.id === 'string').map(m => ({id:m.id,name:m.name || m.id})).slice(0,500) : [] };
  if (kind === 'image') config.engine = ['codex','api','gemini','ark','openrouter'].includes(raw.engine) ? raw.engine : provider.engine;
  else config.protocol = ['codex','openai','openai-responses','anthropic'].includes(raw.protocol) ? raw.protocol : provider.protocol;
  const cli = (config.protocol || config.engine) === 'codex';
  if (config.engine === 'gemini') config.model = config.model.replace(/^models\//, '');
  if (!cli) { config.baseUrl = cleanURL(config.baseUrl); if (!config.model) throw new Error(t('请填写模型名称或从模型列表选择')); }
  return config;
}
function migrate(settings) {
  const before = JSON.stringify(settings.modelServices || null), old = settings.modelServices || {};
  const text = (old.text || []).map(c => validateConnection('text', c)), image = (old.image || []).map(c => validateConnection('image', c));
  if (!text.length) text.push(validateConnection('text', { id:'text-codex',provider:'codex',name:'Codex CLI',model:settings.model || '',codexBin:settings.codexPath || '' }));
  if (!image.length) image.push(validateConnection('image', { id:'image-codex',provider:'codex',name:'Codex CLI',model:settings.model || '',codexBin:settings.codexPath || '' }));
  settings.modelServices = { text, image, textId: text.some(c => c.id === old.textId) ? old.textId : text[0].id, imageId: image.some(c => c.id === old.imageId) ? old.imageId : image[0].id };
  return before !== JSON.stringify(settings.modelServices);
}
function selected(settings, kind) {
  const service = settings.modelServices, connection = service[kind].find(c => c.id === service[kind + 'Id']) || service[kind][0];
  return { ...connection, models: connection.models.map(m => ({...m})) };
}
function contentText(value) { return typeof value === 'string' ? value : Array.isArray(value) ? value.map(p => p.text || '').join('') : ''; }
async function generateText(config, key, system, user, signal) {
  check(signal); let data, result;
  if (config.protocol === 'anthropic') {
    const base = cleanURL(config.baseUrl).replace(/\/v1$/, '');
    data = await jsonRequest(base + '/v1/messages', { json:{model:config.model,system,max_tokens:8192,messages:[{role:'user',content:user}]},headers:headers(config,key),signal }, key);
    result = contentText(data.content);
  } else if (config.protocol === 'openai-responses') {
    data = await jsonRequest(endpoint(config,'responses'), {json:{model:config.model,instructions:system,input:user,stream:false},headers:headers(config,key),signal}, key);
    result = data.output_text || (data.output || []).map(item => contentText(item.content)).join('');
  } else {
    data = await jsonRequest(endpoint(config,'chat/completions'), {json:{model:config.model,messages:[{role:'system',content:system},{role:'user',content:user}],stream:false},headers:headers(config,key),signal}, key);
    result = contentText(data.choices?.[0]?.message?.content);
  }
  check(signal); if (!result?.trim()) throw new Error(t('模型没有返回正文，请检查所选模型和接口')); return result;
}
function aspectRatio(width, height) {
  const ratios = [['1:1',1],['3:4',.75],['4:3',4/3],['9:16',9/16],['16:9',16/9],['2:3',2/3],['3:2',1.5],['21:9',21/9]];
  return ratios.reduce((best, item) => Math.abs(Math.log(item[1] / (width/height))) < Math.abs(Math.log(best[1] / (width/height))) ? item : best)[0];
}
function referenceData(url) { const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(url); if (!match) throw new Error(t('参考图格式不支持')); return {mimeType:match[1],data:match[2]}; }
async function download(url, signal, hops = 0) {
  check(signal); const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(url);
  if (match) return {buf:Buffer.from(match[2],'base64'),ext:match[1].includes('webp')?'.webp':'.png'};
  const r = await request(url,{signal,timeout:60000});
  if ([301,302,303,307,308].includes(r.status) && r.headers.location && hops < 4) return download(new URL(r.headers.location,url).href,signal,hops+1);
  if (r.status < 200 || r.status >= 300) throw serviceError(r.status,{},'');
  check(signal); if (!r.buf.length) throw new Error(t('返回的图片为空'));
  return {buf:r.buf,ext:String(r.headers['content-type']).includes('webp')?'.webp':'.png'};
}
async function decodeImage(data, signal) {
  const image = data.data?.[0] || data.images?.[0] || {};
  const base64 = image.b64_json || image.b64 || image.data;
  if (typeof base64 === 'string' && base64) return {buf:Buffer.from(base64,'base64'),ext:String(image.media_type || '').includes('webp')?'.webp':'.png'};
  const url = image.url || image.image_url?.url || data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (url) return download(url,signal);
  throw new Error(contentText(data.choices?.[0]?.message?.content) || data.error?.message || t('模型没有返回图片，请检查是否选择了生图模型'));
}
function multipart(fields, refs) {
  const boundary = 'banana-' + crypto.randomBytes(12).toString('hex'), parts = [];
  for (const [name,value] of Object.entries(fields)) parts.push(Buffer.from('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"\r\n\r\n'+value+'\r\n'));
  refs.forEach((url,i) => { const ref=referenceData(url),ext=ref.mimeType.split('/')[1]; parts.push(Buffer.from('--'+boundary+'\r\nContent-Disposition: form-data; name="'+(refs.length===1?'image':'image[]')+'"; filename="reference-'+i+'.'+ext+'"\r\nContent-Type: '+ref.mimeType+'\r\n\r\n')); parts.push(Buffer.from(ref.data,'base64')); parts.push(Buffer.from('\r\n')); });
  parts.push(Buffer.from('--'+boundary+'--\r\n')); return {body:Buffer.concat(parts),contentType:'multipart/form-data; boundary='+boundary};
}
async function generateImage(config, key, prompt, refs, width, height, signal) {
  check(signal); const auth = headers(config,key), timeout=600000; let data;
  if (config.engine === 'gemini') {
    const parts = [{text:prompt},...refs.map(url=>({inlineData:referenceData(url)}))];
    data = await jsonRequest(endpoint(config,'models/'+encodeURIComponent(config.model)+':generateContent'), {json:{contents:[{parts}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio:aspectRatio(width,height)}}},headers:{'x-goog-api-key':key},signal,timeout}, key);
    const image = (data.candidates?.[0]?.content?.parts || []).find(p => p.inlineData?.data || p.inline_data?.data);
    if (!image) throw new Error(data.promptFeedback?.blockReason || t('Gemini 没有返回图片'));
    const inline = image.inlineData || image.inline_data; check(signal); return {buf:Buffer.from(inline.data,'base64'),ext:String(inline.mimeType || inline.mime_type).includes('webp')?'.webp':'.png'};
  }
  if (config.engine === 'ark') {
    const area = /seedream[-/.]3[-.]0/i.test(config.model) ? 1048576 : 4194304, ratio=width/height;
    const size = Math.round(Math.sqrt(area*ratio))+'x'+Math.round(Math.sqrt(area/ratio));
    data = await jsonRequest(endpoint(config,'images/generations'), {json:{model:config.model,prompt,n:1,size,response_format:'b64_json',watermark:false,...(refs.length?{image:refs}: {})},headers:auth,signal,timeout}, key);
  } else if (config.engine === 'openrouter') {
    if (!refs.length) {
      try { data = await jsonRequest(endpoint(config,'images'), {json:{model:config.model,prompt,n:1,aspect_ratio:aspectRatio(width,height),output_format:'png'},headers:auth,signal,timeout}, key); }
      catch (e) { if (![404,405].includes(e.status)) throw e; }
    }
    if (!data) data = await jsonRequest(endpoint(config,'chat/completions'), {json:{model:config.model,messages:[{role:'user',content:[{type:'text',text:prompt},...refs.map(url=>({type:'image_url',image_url:{url}}))]}],modalities:['image','text'],image_config:{aspect_ratio:aspectRatio(width,height)},stream:false},headers:auth,signal,timeout}, key);
  } else if (config.provider === 'siliconflow') {
    const qwen = /Qwen-Image/i.test(config.model), edit = /Qwen-Image-Edit/i.test(config.model), kolors = /Kolors/i.test(config.model);
    if (refs.length && !(edit || kolors)) throw new Error(t('参考图修改请选择 Qwen-Image Edit 或 Kolors 生图模型'));
    if (refs.length > (edit ? 3 : 1)) throw new Error(t('该模型最多支持 ') + (edit ? 3 : 1) + t(' 张参考图'));
    const sizes = qwen ? [[1328,1328],[1664,928],[928,1664],[1472,1140],[1140,1472],[1584,1056],[1056,1584]] : [[1024,1024],[1280,960],[960,1280],[1440,720],[720,1440],[1280,720],[720,1280]];
    const target = sizes.reduce((best,item) => Math.abs(Math.log(item[0]/item[1]/(width/height))) < Math.abs(Math.log(best[0]/best[1]/(width/height))) ? item : best);
    data = await jsonRequest(endpoint(config,'images/generations'), {json:{model:config.model,prompt,...(!edit?{image_size:target.join('x')}:{}),...(qwen?{num_inference_steps:50,cfg:4}:{}),...Object.fromEntries(refs.map((url,i)=>[i?'image'+(i+1):'image',url]))},headers:auth,signal,timeout}, key);
  } else {
    const size = width/height > 1.1 ? '1536x1024' : width/height < .9 ? '1024x1536' : '1024x1024';
    if (refs.length) {
      if (!['openai','custom'].includes(config.provider)) throw new Error(t('该服务的所选生图接口不支持参考图，请选择 Codex、OpenAI、Gemini、Seedream 或 OpenRouter'));
      const form = multipart({model:config.model,prompt,n:1,size},refs);
      data = await jsonRequest(endpoint(config,'images/edits'), {body:form.body,headers:{...auth,'Content-Type':form.contentType},signal,timeout}, key);
    } else data = await jsonRequest(endpoint(config,'images/generations'), {json:{model:config.model,prompt,n:1,size},headers:auth,signal,timeout}, key);
  }
  check(signal);
  try { return await decodeImage(data,signal); } catch (e) { if (key && e.message) e.message = e.message.split(key).join('[密钥已隐藏]'); throw e; }
}
async function listModels(config, kind, key, signal) {
  const auth = config.engine === 'gemini' ? {'x-goog-api-key':key} : headers(config,key);
  const url = endpoint(config,'models') + (config.engine==='gemini'?'?pageSize=200':config.provider==='openrouter'&&kind==='image'?'?output_modalities=image':'');
  const data = await jsonRequest(url,{headers:auth,signal,timeout:20000},key);
  let models = data.data || data.models || [];
  models = models.map(m=>({id:String(m.id || m.name || '').replace(/^models\//,''),name:m.displayName || m.name || m.id,output:m.architecture?.output_modalities})).filter(m=>m.id);
  if (kind==='image' && config.engine==='gemini') models = models.filter(m=>/image|imagen|banana/i.test(m.id));
  if (kind==='image' && config.provider==='openrouter') models = models.filter(m=>!m.output || m.output.includes('image'));
  if (kind==='image' && config.provider==='openai') models = models.filter(m=>/gpt-image|dall-e|chatgpt-image/i.test(m.id));
  if (kind==='image' && config.provider==='zhipu') models = models.filter(m=>/cogview/i.test(m.id));
  if (kind==='image' && config.provider==='ark') models = models.filter(m=>/seedream|image|flux|dit/i.test(m.id));
  if (kind==='image' && config.provider==='siliconflow') models = models.filter(m=>/image|kolors|flux|diffusion|imagen|sdxl/i.test(m.id));
  return models.map(({id,name})=>({id,name}));
}
module.exports = { providers,preset,GROUPS,validateConnection,migrate,selected,generateText,generateImage,listModels,aspectRatio,request };

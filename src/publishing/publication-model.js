'use strict';

const { randomUUID } = require('node:crypto');
const PLATFORMS = Object.freeze([
  { id: 'wechat', name: '公众号', icon: 'message-circle', short: '公' },
  { id: 'xiaohongshu', name: '小红书', icon: 'book-heart', short: '红' },
  { id: 'x', name: 'X', icon: 'at-sign', short: 'X' },
]);
const platform = id => PLATFORMS.find(item => item.id === id);
const clone = value => JSON.parse(JSON.stringify(value));
function migrateChannels(settings) {
  if (settings.channels?.version === 1) return false;
  const channels = { version: 1, enabled: {}, selected: {}, accounts: [] };
  for (const item of PLATFORMS) {
    const cfg = settings[item.id] || {};
    const configured = item.id === 'wechat' ? !!(cfg.appId || cfg.secretId) : item.id === 'x' && !!(cfg.user || cfg.consumerKey || cfg.clientId || cfg.accessTokenId || cfg.oauth2AccessId);
    channels.enabled[item.id] = configured;
    if (configured) {
      const account = { id: randomUUID(), platform: item.id, name: cfg.user ? '@' + cfg.user : item.name + '账号', config: clone(cfg), archived: false, legacy: true };
      channels.accounts.push(account); channels.selected[item.id] = account.id;
    }
  }
  settings.channels = channels;
  return true;
}
function activeAccount(channels, id, accountId = channels?.selected?.[id]) {
  return channels?.accounts?.find(account => account.id === accountId && account.platform === id && !account.archived) || null;
}
function renameSource(data, oldPath, newPath) {
  let changed = false;
  for (const item of data.variants) {
    if (item.sourcePath === oldPath) { item.sourcePath = newPath; changed = true; }
    if (item.path === oldPath) { item.path = newPath; changed = true; }
  }
  return changed;
}
module.exports = { PLATFORMS, platform, clone, migrateChannels, activeAccount, renameSource };

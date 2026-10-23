'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildArticlePackage } = require('../src/publishing/article-package');
const { formatWechat } = require('../src/wechat/formatter');
const { WECHAT_THEMES } = require('../src/templates/wechat-themes');
const theme = WECHAT_THEMES[0];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
const resolveImage = async ref => ({ fileName: ref.split('/').pop(), mime: 'image/png', data: png });
const options = markdown => ({ title: '测试文章', markdown, formatted: formatWechat(markdown, theme), resolveImage });

test('a real formatted article keeps inline image positions and shares cover bytes without changing source', async () => {
  const input = { ...options('第一段\n\n![[assets/one.png]]\n\n第二段\n\n![[two.png]]'), coverRef: 'cover.png', themeId: theme.id };
  const original = JSON.stringify(input.formatted);
  const packet = await buildArticlePackage(input);
  assert.equal(packet.assets.length, 1);
  assert.equal(packet.article.coverAssetId, packet.assets[0].id);
  assert.equal(packet.article.imageBindings.length, 2);
  assert.match(packet.article.html, /第一段[\s\S]*banana-asset:\/\/[\s\S]*第二段[\s\S]*banana-asset:\/\//);
  assert.equal(JSON.stringify(input.formatted), original);
  assert.equal(packet.article.markdown, input.markdown);
  assert.deepEqual(Buffer.from(packet.assets[0].base64, 'base64'), png);
  assert.equal(packet.assets[0].fileName, 'one.png');
});

test('missing inline images and cover abort the snapshot instead of silently sending an incomplete article', async () => {
  await assert.rejects(buildArticlePackage({ ...options('![[missing.png]]'), resolveImage: async () => null }), { code: 'IMAGE_MISSING' });
  await assert.rejects(buildArticlePackage({ ...options('正文'), coverRef: 'missing.png', resolveImage: async () => null }), { code: 'IMAGE_MISSING' });
});

test('per-image and serialized package limits also account for base64 overhead', async () => {
  await assert.rejects(buildArticlePackage({ ...options('![[one.png]]'), limits: { imageBytes: 1 } }), { code: 'IMAGE_TOO_LARGE' });
  const packet = await buildArticlePackage(options('![[one.png]]'));
  const byteLength = Buffer.byteLength(JSON.stringify(packet));
  await assert.rejects(buildArticlePackage({ ...options('![[one.png]]'), limits: { packageBytes: byteLength - 1 } }), { code: 'PACKAGE_TOO_LARGE' });
});

test('typed array views only include the selected bytes and transport retries can identify the same snapshot', async () => {
  const storage = Buffer.concat([Buffer.from('private-prefix'), png, Buffer.from('private-suffix')]);
  const input = { ...options('![[one.png]]'), resolveImage: async () => ({ fileName: '/private/one.png', data: new Uint8Array(storage.buffer, storage.byteOffset + 14, png.length) }) };
  const a = await buildArticlePackage(input), b = await buildArticlePackage(input);
  assert.notEqual(a.requestId, b.requestId);
  assert.equal(a.snapshotHash, b.snapshotHash);
  assert.deepEqual(Buffer.from(a.assets[0].base64, 'base64'), png);
  assert.equal(a.assets[0].fileName, 'one.png');
  const changed = await buildArticlePackage({ ...input, title: '新标题' });
  assert.notEqual(changed.snapshotHash, a.snapshotHash);
});

test('unbound formatted images fail locally; remote URLs remain explicit and are never fetched', async () => {
  await assert.rejects(buildArticlePackage({ ...options('正文'), formatted: { html: '<img src="%%BDIMG1%%">', images: [] } }), { code: 'IMAGE_BINDING_INVALID' });
  const packet = await buildArticlePackage({ ...options('![远程](https://example.com/a.png)'), resolveImage: async () => { throw new Error('must not fetch'); } });
  assert.equal(packet.assets.length, 0);
  assert.match(packet.article.html, /https:\/\/example.com\/a.png/);
});

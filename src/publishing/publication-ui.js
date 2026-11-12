'use strict';

const M = require('./publication-model');
const { t } = require('../i18n');
const fingerprint = text => require('node:crypto').createHash('sha256').update(text).digest('hex');
module.exports = function createPublicationUI({ Modal, Notice, MarkdownRenderer, FuzzySuggestModal }) {
class ImagePicker extends FuzzySuggestModal {
  constructor(app, choose) { super(app); this.choose = choose; this.setPlaceholder(t('选择配图')); }
  getItems() { return this.app.vault.getFiles().filter(file => /^(png|jpe?g|webp|gif)$/.test(file.extension)); }
  getItemText(file) { return file.path; }
  onChooseItem(file) { this.choose(file); }
}
function input(parent, label, value = '', type = 'text', multiline = false) {
  const wrap = parent.createDiv('bd-publication-field' + (type === 'month' ? ' is-month' : ''));
  const id = 'publication-' + require('node:crypto').randomUUID();
  wrap.createEl('label', { text: t(label), attr: { for: id } });
  const element = wrap.createEl(multiline ? 'textarea' : 'input', { cls: multiline ? 'bd-textarea' : 'bd-input', attr: { id, type, 'aria-label': t(label) } });
  element.value = value; return element;
}
function select(parent, label, choices, value, changed, compact = false) {
  const wrap = parent.createDiv('bd-publication-field');
  const id = 'publication-' + require('node:crypto').randomUUID();
  if (!compact) wrap.createEl('label', { text: t(label), attr: { for: id } });
  const element = wrap.createEl('select', { cls: 'bd-select', attr: { id, 'aria-label': t(label) } });
  for (const [key, text] of choices) element.createEl('option', { value: key, text });
  element.value = value || ''; element.onchange = async () => { try { await changed(element.value); } catch (error) { element.value = value || ''; new Notice(error.message); } }; return element;
}
function accountBar(view, parent, id) {
  const channels = view.plugin.settings.channels;
  if (!channels) return;
  const accounts = channels.accounts.filter(account => account.platform === id && !account.archived);
  const bar = parent.createDiv('bd-account-bar');
  if (!accounts.length) { bar.createDiv({ cls: 'bd-publication-muted', text: t('还没有可用的发布账号') }); return null; }
  select(bar, '发布账号', [['', t('选择账号')], ...accounts.map(account => [account.id, account.name])], channels.selected[id], async value => {
    await view.saveVariantDraft?.();
    view.remember();
    await view.plugin.updateChannels(next => { next.selected[id] = value; });
    view.restorePlatformState(); view.render();
  });
  const account = M.activeAccount(channels, id);
  if (!account) bar.createDiv({ cls: 'bd-publication-muted', text: t('还没有可用的发布账号') });
  return account;
}
function settingsAccountBar(tab, parent, id) {
  if (!tab.plugin.settings.channels) return;
  const channels = tab.plugin.settings.channels;
  select(parent, '配置账号', [['', t('选择账号')], ...channels.accounts.filter(account => account.platform === id && !account.archived).map(account => [account.id, account.name])], channels.selected[id], async value => {
    tab.plugin.view?.remember();
    await tab.plugin.updateChannels(next => { next.selected[id] = value; });
    tab.plugin.view?.restorePlatformState(); tab.display(); tab.plugin.view?.render();
  });
}
async function variantEditor(view, parent, id) {
  const account = M.activeAccount(view.plugin.settings.channels, id), file = view.activeFile();
  if (!file || !account) return;
  const articlePath = file.path, accountId = account.id;
  const source = await view.articleMarkdown(file);
  if (!parent.isConnected || view.articlePath !== articlePath || view.plugin.settings.channels.selected[id] !== accountId) return;
  let variant = view.plugin.publication.variants.find(item => item.sourcePath === file.path && item.accountId === account.id);
  const savedFile = variant && view.app.vault.getAbstractFileByPath(variant.path);
  const savedText = savedFile ? await view.app.vault.read(savedFile) : source;
  let savedHash = fingerprint(savedText);
  if (!parent.isConnected) return;
  const details = parent.createEl('details', { cls: 'bd-variant-editor' });
  details.open = id === 'xiaohongshu'; details.createEl('summary', { text: t('独立平台版本') + ' · ' + account.name });
  const title = input(details, '平台标题', variant?.title || view.title || file.basename);
  if (id === 'wechat') view.wechatTitle = title.value;
  const text = input(details, '平台正文', savedText, 'text', true); text.rows = 12;
  const images = { value: (variant?.images || []).join('\n') };
  const imageList = details.createDiv('bd-variant-images');
  const status = details.createDiv('bd-publication-muted', { attr: { role: 'status', 'aria-live': 'polite' } });
  if (variant?.sourceHash && variant.sourceHash !== fingerprint(source)) status.setText(t('原稿已变化，当前平台版本保留你的编辑。'));
  let dirty = false; const markDirty = () => { dirty = true; view.variantDirty = true; status.setText(t('尚未保存')); }; title.oninput = text.oninput = images.oninput = markDirty;
  const drawImages = () => {
    imageList.empty();
    for (const path of images.value.split('\n').filter(Boolean)) {
      const file = view.app.vault.getAbstractFileByPath(path), card = imageList.createDiv('bd-variant-image');
      if (file) card.createEl('img', { attr: { src: view.app.vault.getResourcePath(file), alt: file.basename } });
      card.createSpan({ text: file?.name || path });
      view.button(card, t('移除'), () => { images.value = images.value.split('\n').filter(value => value !== path).join('\n'); markDirty(); drawImages(); });
    }
  }; drawImages();
  view.button(details, t('添加配图'), () => new ImagePicker(view.app, file => { images.value = [...new Set([...images.value.split('\n').filter(Boolean), file.path])].join('\n'); markDirty(); drawImages(); }).open(), 'bd-btn', 'image-plus');
  const actions = details.createDiv('bd-publication-row');
  let saving;
  const persist = async () => {
    if (!title.value.trim()) throw new Error(t('请填写内容标题'));
    const snapshot = [title.value, text.value, images.value].join('\u0000');
    const markdown = text.value;
    variant = await view.plugin.savePlatformVariant({ id: variant?.id, platform: id, accountId, sourcePath: file.path, sourceHash: fingerprint(source), expectedHash: savedHash, title: title.value.trim(), markdown, images: images.value.split('\n').map(value => value.trim()).filter(Boolean) });
    savedHash = fingerprint(markdown);
    dirty = snapshot !== [title.value, text.value, images.value].join('\u0000'); view.variantDirty = dirty;
    if (id === 'wechat') view.wechatTitle = variant.title;
    status.setText(t(dirty ? '尚未保存' : '已保存')); return variant;
  };
  const save = () => saving || (saving = persist().finally(() => { saving = null; }));
  view.saveVariantDraft = async () => { if (dirty) await save(); };
  view.button(actions, t('保存平台版本'), save, 'bd-btn bd-primary', 'save');
  view.button(actions, t('AI 改写'), async button => {
    if (view.busy) return;
    button.disabled = true;
    const job = view.beginTask('platform-rewrite'); view.busy = true; status.setText(t('正在改写…'));
    try {
      const prompt = '为' + M.platform(id).name + '生成可直接编辑的正文。保留原文事实，不编造数据、经历或承诺。只返回正文 Markdown。账号要求：' + (account.rewriteInstructions || '保持原作者口吻');
      text.value = await view.plugin.text(job.connections.text, prompt, source, job.controller.signal); markDirty();
    } catch (error) { status.setText(error.message); }
    finally { view.busy = false; view.finishTask(job); button.disabled = false; }
  }, 'bd-btn', 'sparkles');
  view.button(actions, t('复制标题和正文'), async () => { await save(); await navigator.clipboard.writeText(title.value + '\n\n' + text.value); new Notice(t('已复制')); });
  view.button(actions, t('打开 Markdown'), async () => { const saved = await save(); await view.app.workspace.getLeaf('tab').openFile(view.app.vault.getAbstractFileByPath(saved.path)); });

  if (id === 'xiaohongshu') {
    const preview = details.createDiv('bd-variant-preview');
    view.button(actions, t('预览图文'), async () => {
      preview.empty(); preview.createEl('h3', { text: title.value });
      await MarkdownRenderer.render(view.app, text.value, preview, file.path, view);
      for (const path of images.value.split('\n').map(value => value.trim()).filter(Boolean)) {
        const image = view.app.vault.getAbstractFileByPath(path);
        if (!image || !/^(png|jpe?g|webp|gif)$/.test(image.extension)) { preview.createDiv({ cls: 'bd-error', text: t('图片未找到：') + path }); continue; }
        preview.createEl('img', { attr: { src: view.app.vault.getResourcePath(image), alt: image.basename } });
      }
    });
  }
  return { variant, title, text, save };
}
async function renderXiaohongshu(view, body) {
  const page = body.createDiv('bd-publication-page'); page.createEl('h2', { text: t('小红书') });
  accountBar(view, page, 'xiaohongshu');
  page.createDiv({ cls: 'bd-publication-muted', text: t('编辑独立文案与图片，发布后自行到平台发布。') });
  if (!view.activeFile()) { page.createDiv({ text: t('先选择一篇文章') }); return; }
  await variantEditor(view, page, 'xiaohongshu');
}
return { renderXiaohongshu, accountBar, settingsAccountBar, variantEditor, fingerprint };
};

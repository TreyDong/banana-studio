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
function badge(parent, id, text) {
  const el = parent.createSpan({ cls: 'bd-platform-badge bd-platform-' + id, text: text || t(M.platform(id)?.name || id) });
  return el;
}
function accountBar(view, parent, id) {
  const channels = view.plugin.settings.channels;
  if (!channels) return;
  const accounts = channels.accounts.filter(account => account.platform === id && !account.archived);
  const bar = parent.createDiv('bd-account-bar');
  select(bar, '发布账号', [['', t('选择账号')], ...accounts.map(account => [account.id, account.name])], channels.selected[id], async value => {
    await view.saveVariantDraft?.();
    view.remember();
    await view.plugin.updateChannels(next => { next.selected[id] = value; });
    view.restorePlatformState(); view.render();
  });
  view.button(bar, t('管理账号'), () => view.navigateTab('platforms'), 'bd-btn', 'settings-2');
  const account = M.activeAccount(channels, id);
  if (!account) bar.createDiv({ cls: 'bd-publication-muted', text: t('先添加并选择一个账号') });
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
function renderPlatforms(view, body) {
  const page = body.createDiv('bd-publication-page');
  page.createEl('h2', { text: t('平台与账号') });
  page.createDiv({ cls: 'bd-publication-muted', text: t('选择使用的平台，为每个账号分别设置。停用或归档不影响已有发布记录。') });
  const channels = view.plugin.settings.channels;
  for (const platform of M.PLATFORMS) {
    const card = page.createDiv('bd-platform-card');
    const head = card.createDiv('bd-publication-row'); badge(head, platform.id);
    const enabled = !!channels.enabled[platform.id];
    const toggle = view.button(head, t(enabled ? '已启用' : '启用平台'), async () => {
      view.remember(); await view.plugin.updateChannels(next => { next.enabled[platform.id] = !enabled; }); view.render();
    }, 'bd-btn' + (enabled ? ' is-enabled' : ''));
    toggle.setAttribute('aria-pressed', String(enabled)); toggle.setAttribute('aria-label', t('启用平台') + ' ' + t(platform.name));
    if (!enabled) continue;
    const accounts = channels.accounts.filter(account => account.platform === platform.id);
    for (const account of accounts) {
      const row = card.createDiv('bd-managed-account');
      const fields = row.createDiv('bd-account-fields');
      const name = input(fields, '账号名称', account.name); name.disabled = !!account.archived;
      const source = view.plugin.accountPublicationSource(account.id);
      const folder = !account.archived ? publicationFolderField(view, fields, source?.folder || '') : null;
      const actions = row.createDiv('bd-publication-row');
      if (account.archived) {
        actions.createSpan({ cls: 'bd-publication-muted', text: t('已归档') });
        view.button(actions, t('恢复账号'), async () => { await view.plugin.updateChannels(next => { next.accounts.find(item => item.id === account.id).archived = false; }); view.render(); });
        continue;
      }
      view.button(actions, t('保存账号'), async button => {
        button.disabled = true;
        try { view.remember(); await view.plugin.savePublicationAccount({ id: account.id, platform: platform.id, name: name.value, folder: folder.value, sourceId: source?.id }); view.restorePlatformState(); view.render(); }
        finally { button.disabled = false; }
      });
      if (platform.id !== 'xiaohongshu') view.button(actions, t('连接与发布设置'), async () => {
        view.remember(); await view.plugin.updateChannels(next => { next.selected[platform.id] = account.id; }); view.restorePlatformState();
        view.app.setting.open(); view.app.setting.openTabById(view.plugin.manifest.id); view.plugin.settingsTab.settingsPage = platform.id; view.plugin.settingsTab.display();
      }, 'bd-btn', 'settings-2');
      view.button(actions, t('归档账号'), async () => {
        view.remember(); await view.plugin.updateChannels(next => { next.accounts.find(item => item.id === account.id).archived = true; if (next.selected[platform.id] === account.id) next.selected[platform.id] = ''; }); view.restorePlatformState(); view.render();
      });
      const details = row.createEl('details'); details.createEl('summary', { text: t('AI 改写要求') });
      const rules = input(details, '这个账号的表达与内容要求', account.rewriteInstructions || '', 'text', true);
      view.button(details, t('保存要求'), async () => { await view.plugin.updateChannels(next => { next.accounts.find(item => item.id === account.id).rewriteInstructions = rules.value; }); new Notice(t('已保存')); });
    }
    const adding = card.createDiv('bd-account-adding');
    const name = input(adding, '新账号名称');
    const folder = publicationFolderField(view, adding, '');
    view.button(adding, t('添加账号'), async button => {
      button.disabled = true;
      try { view.remember(); await view.plugin.savePublicationAccount({ platform: platform.id, name: name.value, folder: folder.value }); view.restorePlatformState(); view.render(); }
      finally { button.disabled = false; }
    }, 'bd-btn bd-primary', 'plus');
    card.createDiv({ cls: 'bd-publication-muted', text: t('放入发布文件夹后自动补齐属性，缺失日期使用放入日期，已有值保留。') });
    if (platform.id === 'xiaohongshu') card.createDiv({ cls: 'bd-publication-muted', text: t('编辑独立文案与图片，发布日历从你指定的文件夹读取发布属性。') });
  }
}
function iconButton(view, parent, label, action, icon, extra = '') {
  const button = view.button(parent, '', action, 'bd-btn bd-calendar-icon ' + extra, icon);
  button.setAttribute('aria-label', t(label)); button.title = t(label); return button;
}
function publicationFolderField(view, parent, value) {
  const row = parent.createDiv('bd-calendar-folder-row');
  const field = input(row, '发布文件夹（可选）', value);
  field.placeholder = t('选择文件夹，或填写新文件夹路径');
  iconButton(view, row, '选择发布文件夹', () => new FolderPicker(view.app, folder => { field.value = folder.path; }).open(), 'folder-open');
  return field;
}
class FolderPicker extends FuzzySuggestModal {
  constructor(app, choose) { super(app); this.choose = choose; this.setPlaceholder(t('选择发布文件夹')); }
  getItems() { return this.app.vault.getAllLoadedFiles().filter(file => Array.isArray(file.children) && file.path && !file.path.split('/').some(part => part.startsWith('.'))); }
  getItemText(folder) { return folder.path; }
  onChooseItem(folder) { this.choose(folder); }
}
class MonthPicker extends Modal {
  constructor(view) { super(view.app); this.view = view; this.year = Number(view.calendarMonth.slice(0, 4)); }
  onOpen() { this.modalEl.addClass('bd-calendar-month-picker'); this.setTitle(t('选择月份')); this.draw(); }
  draw() {
    const root = this.contentEl; root.empty();
    const head = root.createDiv('bd-month-year');
    iconButton(this.view, head, '上一年', () => { this.year--; this.draw(); }, 'chevron-left');
    head.createSpan({ text: String(this.year) });
    iconButton(this.view, head, '下一年', () => { this.year++; this.draw(); }, 'chevron-right');
    const grid = root.createDiv('bd-month-grid');
    for (let index = 1; index <= 12; index++) {
      const month = this.year + '-' + String(index).padStart(2, '0');
      const button = this.view.button(grid, index + t('月'), () => { this.view.calendarMonth = month; this.close(); this.view.renderBody(); }, 'bd-btn');
      button.setAttribute('aria-pressed', String(month === this.view.calendarMonth)); button.setAttribute('aria-label', month);
    }
  }
  onClose() { this.contentEl.empty(); }
}
class CalendarSettings extends Modal {
  constructor(view, source) { super(view.app); this.view = view; this.source = source; this.editing = source !== undefined; }
  onOpen() { this.modalEl.addClass('bd-calendar-settings-modal'); this.setTitle(t('发布日历设置')); this.draw(); }
  draw() {
    const view = this.view, root = this.contentEl; root.empty(); root.addClass('bd-publication-form');
    if (this.editing) { this.drawEditor(root); return; }
    root.createDiv({ cls: 'bd-publication-muted', text: t('账号的发布文件夹会自动补齐 Markdown 属性，日历随文件变化更新。') });
    const channels = view.plugin.settings.channels, sources = channels.calendarSources || [];
    for (const source of sources) {
      const row = root.createDiv('bd-calendar-source-row');
      const meta = row.createDiv('bd-publication-row'); badge(meta, source.platform);
      meta.createSpan({ text: channels.accounts.find(account => account.id === source.accountId)?.name || t('按属性识别账号') });
      row.createDiv({ text: source.folder, cls: 'bd-calendar-source-path' });
      const actions = row.createDiv('bd-publication-row');
      view.button(actions, t('修改'), () => { this.source = source; this.editing = true; this.draw(); });
      view.button(actions, t('停止监控'), async () => { await view.plugin.removeCalendarSource(source.id); this.draw(); view.renderBody(); });
    }
    if (!sources.length) root.createDiv({ cls: 'bd-publication-muted', text: t('尚未设置发布文件夹') });
    view.button(root, t('添加发布文件夹'), () => { this.source = null; this.editing = true; this.draw(); }, 'bd-btn bd-primary', 'folder-plus');
    if (view.plugin.calendarIndex?.issues.length) {
      const issues = root.createEl('details'); issues.createEl('summary', { text: t('需要检查的文件') });
      for (const issue of view.plugin.calendarIndex.issues) issues.createDiv({ cls: 'bd-publication-muted', text: issue });
    }
  }
  drawEditor(root) {
    const view = this.view, channels = view.plugin.settings.channels, source = this.source || {};
    let platformId = source.platform || 'wechat', accountId = source.accountId ?? channels.selected[platformId] ?? '';
    select(root, '平台', M.PLATFORMS.map(platform => [platform.id, t(platform.name)]), platformId, value => { platformId = value; accountId = channels.selected[value] || ''; drawAccounts(); });
    const target = root.createDiv();
    const drawAccounts = () => {
      target.empty();
      select(target, '账号', [['', t('按属性识别账号')], ...channels.accounts.filter(account => account.platform === platformId).map(account => [account.id, account.name + (account.archived ? ' · ' + t('已归档') : '')])], accountId, value => { accountId = value; });
    }; drawAccounts();
    const folderRow = root.createDiv('bd-calendar-folder-row');
    const folder = input(folderRow, '发布文件夹', source.folder || '');
    iconButton(view, folderRow, '选择发布文件夹', () => new FolderPicker(view.app, selected => { folder.value = selected.path; }).open(), 'folder-open');
    const fields = { ...M.CALENDAR_FIELDS, ...source.fields };
    const date = input(root, '发布日期属性', fields.date);
    root.createDiv({ cls: 'bd-publication-muted', text: t('例如 published: 2026-11-02。仅显示已到达的日期，包含子文件夹。') });
    const autoRow = root.createEl('label', { cls: 'bd-auto-properties-toggle' });
    const auto = autoRow.createEl('input', { attr: { type: 'checkbox', 'aria-label': t('自动补齐缺失属性') } }); auto.checked = source.autoProperties !== false;
    autoRow.createSpan({ text: t('自动补齐缺失属性') });
    const mappings = root.createEl('details'); mappings.createEl('summary', { text: t('其他属性映射（可选）') });
    const controls = { date };
    for (const [key, label] of [['title', '标题属性'], ['account', '账号属性'], ['url', '发布链接属性'], ['cover', '封面属性'], ['status', '发布状态属性']]) controls[key] = input(mappings, label, fields[key]);
    const publishedValues = input(mappings, '已发布的状态值', source.publishedValues || '已发布,published');
    mappings.createDiv({ cls: 'bd-publication-muted', text: t('状态属性留空时，只检查发布日期；设置后仅显示匹配的状态。多个状态值用逗号分隔。') });
    const error = root.createDiv({ cls: 'bd-error', attr: { role: 'alert' } });
    const actions = root.createDiv('bd-publication-row');
    view.button(actions, t('返回'), () => { this.editing = false; this.draw(); });
    view.button(actions, t('保存文件夹设置'), async button => {
      button.disabled = true; error.setText('');
      try {
        await view.plugin.saveCalendarSource({ id: source.id, platform: platformId, accountId, folder: folder.value, fields: Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value])), publishedValues: publishedValues.value, autoProperties: auto.checked });
        this.editing = false; this.source = undefined; this.draw(); view.renderBody();
      } catch (failure) { error.setText(failure.message); }
      finally { button.disabled = false; }
    }, 'bd-btn bd-primary');
  }
  onClose() { this.contentEl.empty(); }
}
function openCalendarSettings(view, source) { new CalendarSettings(view, source).open(); }
async function openCalendarNote(view, record) {
  const file = view.app.vault.getAbstractFileByPath(record.sourcePath);
  if (!file || file.extension !== 'md') throw new Error(t('原稿已不存在'));
  await view.app.workspace.getLeaf('tab').openFile(file);
}
function renderCalendar(view, body) {
  const page = body.createDiv('bd-publication-page bd-calendar-page');
  view.calendarMonth ||= M.dayKey(new Date()).slice(0, 7);
  const toolbar = page.createDiv('bd-calendar-toolbar');
  const months = toolbar.createDiv('bd-calendar-month-nav');
  const move = delta => { const [year, month] = view.calendarMonth.split('-').map(Number); view.calendarMonth = M.dayKey(new Date(year, month - 1 + delta, 1)).slice(0, 7); view.renderBody(); };
  iconButton(view, months, '上个月', () => move(-1), 'chevron-left');
  const [year, month] = view.calendarMonth.split('-').map(Number);
  const monthButton = view.button(months, year + t('年') + month + t('月'), () => new MonthPicker(view).open(), 'bd-btn bd-calendar-month-trigger');
  monthButton.setAttribute('aria-label', t('选择月份')); monthButton.title = t('选择月份');
  iconButton(view, months, '下个月', () => move(1), 'chevron-right');
  view.button(months, t('本月'), () => { view.calendarMonth = M.dayKey(new Date()).slice(0, 7); view.renderBody(); }, 'bd-btn bd-calendar-today');
  const channels = view.plugin.settings.channels, data = view.plugin.calendarIndex || { records: [], issues: [] };
  select(toolbar, '筛选平台', [['', t('全部平台')], ...M.PLATFORMS.map(platform => [platform.id, t(platform.name)])], view.calendarPlatform, value => { view.calendarPlatform = value; view.calendarAccount = ''; view.renderBody(); }, true);
  const accounts = new Map(channels.accounts.filter(account => !view.calendarPlatform || account.platform === view.calendarPlatform).map(account => [account.id, t(M.platform(account.platform).name) + ' · ' + account.name + (account.archived ? ' · ' + t('已归档') : '')]));
  for (const record of data.records) if (record.accountId && (!view.calendarPlatform || record.platform === view.calendarPlatform) && !accounts.has(record.accountId)) accounts.set(record.accountId, t(M.platform(record.platform).name) + ' · ' + record.accountName);
  select(toolbar, '筛选账号', [['', t('全部账号')], ...accounts], view.calendarAccount, value => { view.calendarAccount = value; view.renderBody(); }, true);
  iconButton(view, toolbar, '发布日历设置', () => openCalendarSettings(view), 'settings-2', 'bd-calendar-settings-trigger');
  const records = M.filterRecords(data, { month: view.calendarMonth, platform: view.calendarPlatform, accountId: view.calendarAccount });
  const stats = page.createDiv('bd-publication-row bd-calendar-summary');
  stats.createSpan({ text: records.length + ' ' + t('篇') });
  for (const platform of M.PLATFORMS) badge(stats, platform.id, t(platform.name) + ' ' + records.filter(record => record.platform === platform.id).length);
  const grid = page.createDiv('bd-calendar-grid'); grid.setAttribute('aria-label', t('已发布内容月历'));
  for (const name of ['一', '二', '三', '四', '五', '六', '日']) grid.createDiv({ cls: 'bd-calendar-weekday', text: t(name) });
  const first = new Date(year, month - 1, 1), start = (first.getDay() + 6) % 7, days = new Date(year, month, 0).getDate(), weeks = Math.ceil((start + days) / 7);
  grid.style.setProperty('--calendar-weeks', String(weeks));
  for (let index = 0; index < weeks * 7; index++) {
    const day = index - start + 1, cell = grid.createDiv('bd-calendar-cell');
    if (day < 1 || day > days) { cell.addClass('is-outside'); continue; }
    const key = view.calendarMonth + '-' + String(day).padStart(2, '0');
    if (key === M.dayKey(new Date())) cell.addClass('is-today');
    cell.createSpan({ cls: 'bd-calendar-date', text: String(day), attr: { 'aria-label': key } });
    const events = cell.createDiv('bd-calendar-events');
    for (const record of records.filter(record => M.dayKey(record.publishedAt) === key)) {
      const button = view.button(events, record.title, () => openCalendarNote(view, record), 'bd-calendar-item bd-platform-' + record.platform);
      button.setAttribute('aria-label', t(M.platform(record.platform).name) + ' · ' + record.accountName + ' · ' + record.title);
      button.title = t(M.platform(record.platform).name) + ' · ' + record.accountName + '\n' + record.title;
      const meta = button.createSpan({ cls: 'bd-calendar-item-meta', text: t(M.platform(record.platform).name) + ' · ' + record.accountName });
      meta.setAttribute('aria-hidden', 'true');
    }
  }
  if (!(channels.calendarSources || []).length) {
    const empty = page.createDiv('bd-calendar-empty');
    view.button(empty, t('设置发布文件夹'), () => openCalendarSettings(view), 'bd-btn', 'folder-open');
  }
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
  const status = details.createDiv({ cls: 'bd-publication-muted', attr: { role: 'status', 'aria-live': 'polite' } });
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
  page.createDiv({ cls: 'bd-publication-muted', text: t('编辑独立文案与图片，发布日历从你指定的文件夹读取发布属性。') });
  if (!view.activeFile()) { page.createDiv({ text: t('先选择一篇文章') }); return; }
  await variantEditor(view, page, 'xiaohongshu');
}
return { renderPlatforms, renderCalendar, renderXiaohongshu, accountBar, settingsAccountBar, variantEditor, openCalendarSettings, openCalendarNote, fingerprint };
};

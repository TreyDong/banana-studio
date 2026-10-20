const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const http = require('node:http');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const services = require('../src/services/model-services.js');
const figures = require('../src/illustrations/figure-agent.js');
const i18n = require('../src/i18n.js');
let hostLanguage = 'zh-CN';
class HostPlugin {
  constructor(app) { this.app = app; this.manifest = {id:'banana-design',version:'0.10.2',dir:'.obsidian/plugins/banana-design'}; this.commands=[]; }
  async loadData() { return this.saved || null; }
  async saveData(data) { this.saved = data; }
  registerView(type,factory) { this.factory=factory; }
  addRibbonIcon() {}
  addCommand(command) { this.commands.push(command); }
  addSettingTab() {}
  registerEvent() {}
}
const host = {getLanguage:()=>hostLanguage,Plugin:HostPlugin,ItemView:class{},PluginSettingTab:class{},Modal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},FuzzySuggestModal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},TFile:class{},MarkdownView:class{},Menu:class{},Notice:class{},normalizePath:s=>s.replace(/\\/g,'/'),setIcon(){}};
function load(filename, expose=false) {
  const mod={exports:{}}; const local=createRequire(filename);
  const safeRequire = id => {
    if(id==='obsidian') return host;
    if(/\.(png|svg|webp)$/.test(id)) { const file=path.resolve(path.dirname(filename),id); return 'data:image/'+(id.endsWith('svg')?'svg+xml':id.endsWith('webp')?'webp':'png')+';base64,'+fs.readFileSync(file).toString('base64'); }
    if(id==='child_process') return {...require(id),spawn(){throw new Error('Unexpected child process during plugin load');},execFileSync(){throw new Error('Unexpected CLI discovery during plugin load');}};
    return local(id);
  };
  let source=fs.readFileSync(filename,'utf8');
  if(expose) source+='\nmodule.exports.testHooks = {readGeneratedImage,BDView,TemplateLibraryModal,TemplateManagerModal,PromptTemplateEditor,updateTemplateSettings,imageFolder,outputRules,createOutputTask,outputImageName,promptTemplates,templateChoices,figureRecipe,renderFigureRecipe,renderTemplatePrompt,templateLabel,PLATFORMS,FIGURE_SIZES,PALETTES,RENDERINGS,MODULES};';
  vm.runInNewContext(source,{module:mod,exports:mod.exports,require:safeRequire,Buffer,URL,Blob,process,console,setTimeout,clearTimeout,AbortController,document:{getElementById:()=>null}},{filename});
  return mod.exports;
}
const sourcePlugin=load(path.join(root,'src/main.js'),true);
const hooks=sourcePlugin.testHooks;
test('standard three-file release loads without sibling modules, assets, network or CLI launch',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bd-install-'));
  try {
    for(const file of ['main.js','manifest.json','styles.css']) fs.copyFileSync(path.join(root,file),path.join(temp,file));
    const Plugin=load(path.join(temp,'main.js'),true);
    for(const asset of ['gpt-concept-type','gpt-cinematic-story','gpt-object-editorial','gpt-human-narrative','gpt-opinion-collage','gpt-quiet-photo','gpt-literary-painting']) {
      const preview=Plugin.testHooks.BDView.prototype.templatePreview.call({}, {coverPreviewAsset:asset});
      assert.match(preview,/^data:image\/webp;base64,/);
      const bytes=Buffer.from(preview.split(',')[1],'base64');
      assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    }
    const app={vault:{adapter:{exists:async()=>true,mkdir:async()=>{},getBasePath(){throw new Error('Unexpected installed module lookup');}},on:()=>({})},workspace:{on:()=>({})}};
    const plugin=new Plugin(app); await plugin.onload();
    assert.equal(typeof plugin.layout.renderNeonCover,'function');
    assert.equal(typeof plugin.figureAgent.replacePlaceholders,'function');
    assert.equal(typeof plugin.services.generateImage,'function');
    assert.equal(plugin.commands[0].id,'open');
    assert.equal(plugin.settings.modelServices.textId,'text-codex');
    plugin.onunload();
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
test('both bundled preview images remain available without an installed asset directory',()=>{
  const preview=hooks.BDView.prototype.templatePreview;
  assert.match(preview.call({}, {previewAsset:'dan-koe'}),/^data:image\/png;base64,/);
  assert.match(preview.call({}, {previewAsset:'neon-card'}),/^data:image\/svg\+xml;base64,/);
});
test('legacy service migration preserves selection, secrets, sessions and custom paths',()=>{
  const original={model:'old-model',codexPath:'/custom/codex',outputFolder:'assets/Examples',sessions:{'Article.md':{title:'Fixture'}}};
  services.migrate(original);
  assert.equal(original.modelServices.text[0].model,'old-model');
  assert.equal(original.modelServices.image[0].codexBin,'/custom/codex');
  original.modelServices.text[0].secretId='fixture-secret-ref';
  original.modelServices.text[0].models=[{id:'old-model',name:'Model'}];
  services.migrate(original);
  assert.equal(original.modelServices.text[0].secretId,'fixture-secret-ref');
  assert.equal(original.sessions['Article.md'].title,'Fixture');
  assert.equal(original.outputFolder,'assets/Examples');
});
test('API configuration rejects remote plaintext and credential-bearing URLs while allowing loopback',()=>{
  const config={provider:'custom',model:'fixture'};
  for(const baseUrl of ['http://example.com/v1','https://user:pass@example.com/v1','https://example.com/v1?key=secret','file:///etc/passwd']) assert.throws(()=>services.validateConnection('text',{...config,baseUrl}));
  for(const baseUrl of ['https://example.com/v1','http://127.0.0.1:1234/v1','http://[::1]:1234/v1']) assert.equal(services.validateConnection('text',{...config,baseUrl}).baseUrl,baseUrl);
});
test('text API sends the selected context, sanitizes credentials in errors, and cancels pending requests',async()=>{
  let mode='ok',received;
  const server=http.createServer((req,res)=>{ let raw=''; req.on('data',c=>raw+=c);req.on('end',()=>{received={path:req.url,key:req.headers.authorization,body:JSON.parse(raw)};if(mode==='wait')return;if(mode==='error'){res.writeHead(401);res.end(JSON.stringify({error:{message:'invalid fixture-key'}}));}else {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'fixture answer'}}]}));}});});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const config={protocol:'openai',model:'fixture-model',baseUrl:'http://127.0.0.1:'+server.address().port+'/v1'};
  try {
    assert.equal(await services.generateText(config,'fixture-key','system fixture','article fixture'), 'fixture answer');
    assert.equal(received.path,'/v1/chat/completions');assert.equal(received.key,'Bearer fixture-key');assert.equal(received.body.messages[1].content,'article fixture');
    mode='error';await assert.rejects(services.generateText(config,'fixture-key','system','user'),e=>!e.message.includes('fixture-key')&&e.message.includes('401'));
    mode='wait';const abort=new AbortController();const pending=services.generateText(config,'fixture-key','system','user',abort.signal);setTimeout(()=>abort.abort(),20);await assert.rejects(pending,e=>e.name==='AbortError');
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('agent image paths cannot read unrelated files or follow symlinks outside the job directory',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bd-path-'));const job=path.join(temp,'job');fs.mkdirSync(job);
  const png=Buffer.from([137,80,78,71,13,10,26,10,0]);const inside=path.join(job,'output.png'),outside=path.join(temp,'private.png');fs.writeFileSync(inside,png);fs.writeFileSync(outside,png);fs.symlinkSync(outside,path.join(job,'escape.png'));fs.writeFileSync(path.join(job,'fake.png'),'private text');
  try {assert.deepEqual(await hooks.readGeneratedImage(inside,job),png);await assert.rejects(hooks.readGeneratedImage(outside,job));await assert.rejects(hooks.readGeneratedImage(path.join(job,'escape.png'),job));await assert.rejects(hooks.readGeneratedImage(path.join(job,'fake.png'),job));}finally{fs.rmSync(temp,{recursive:true,force:true});}
});
function batch(content) {
 const blocks=figures.articleBlocks(content);return blocks.map((block,i)=>({sourcePath:'Article.md',anchor:figures.makeAnchor(block,blocks,'Article.md',content),placeholder:figures.placeholderFor('fixture',i),status:'planned'}));
}
test('approved batch reserves exact markers and inserts all images without rewriting prose',()=>{
 const text='# Example\n\nFirst paragraph.\n\nSecond paragraph.\n';const items=batch(text);const reserved=figures.preparePlaceholders(text,items,'Article.md');
 for(const [i,item] of items.entries()) Object.assign(item,{status:'done',vaultPath:'assets/fixture-'+i+'.png'});
 const inserted=figures.replacePlaceholders(reserved.content,items,'Article.md');assert.equal(inserted.replaced,2);assert.ok(inserted.content.includes('First paragraph.'));assert.ok(inserted.content.includes('Second paragraph.'));assert.ok(inserted.content.includes('![[assets/fixture-0.png]]'));
 assert.equal(figures.replacePlaceholders(inserted.content,items,'Article.md').already,2);
 assert.equal(figures.removePlaceholders(reserved.content,items,'Article.md',reserved.reservation).content,text);
});
test('missing, duplicate and cross-article markers abort the entire batch without append fallback',()=>{
 const text='First paragraph.\n\nSecond paragraph.\n';const items=batch(text);const reserved=figures.preparePlaceholders(text,items,'Article.md');for(const item of items)Object.assign(item,{status:'done',vaultPath:'assets/'+item.placeholder+'.png'});
 assert.throws(()=>figures.replacePlaceholders(reserved.content.replace(items[0].placeholder,''),items,'Article.md'));
 assert.throws(()=>figures.replacePlaceholders(reserved.content+'\n\n'+items[0].placeholder,items,'Article.md'));
 assert.throws(()=>figures.replacePlaceholders(reserved.content,items,'Other.md'));
 assert.throws(()=>figures.prepareInsertion('Changed paragraph.',items,'Article.md'));
});
test('output paths refuse traversal, hidden config and absolute directories',()=>{
 for(const p of ['../outside','/tmp/out','~/.codex','assets/.obsidian/secret','assets/.git']) assert.throws(()=>hooks.imageFolder(p));
 assert.equal(hooks.imageFolder('assets/Images'),'assets/Images');
});

test('template dialogs preserve the host keyboard scope when opened for covers or illustrations',()=>{
  const view={app:{}};
  for(const scope of ['cover','figure']) {
    const library=new hooks.TemplateLibraryModal(view,scope);
    const editor=new hooks.PromptTemplateEditor(view,{name:'Fixture'},false,scope);
    for(const dialog of [library,editor]) { assert.equal(typeof dialog.scope,'object'); dialog.open(); assert.ok(dialog.scope.win); assert.equal(dialog.templateScope,scope); }
  }
});


test('new article recipes render chosen dimensions and keep cover titles out of body illustrations',()=>{
  const {EXTRA_TEMPLATES}=require('../src/templates/catalog.js');
  assert.equal(EXTRA_TEMPLATES.length,35);
  for(const template of EXTRA_TEMPLATES){
    const state={platform:'custom',customW:1600,customH:640,textLevel:'title'};
    const cover=hooks.renderTemplatePrompt(template,state,'事实与观点','A bridge connecting two libraries');
    assert.ok(cover.includes('事实与观点'));assert.ok(cover.includes('A bridge connecting two libraries'));assert.ok(cover.includes('1600 x 640'));
    assert.ok(!/\{(?:concept|width|height|ratio|text_rule)\}/.test(cover));
    const noText=hooks.renderTemplatePrompt(template,{...state,textLevel:'none'},'不应出现的标题','A quiet scene');
    assert.ok(noText.includes('Do not render any text'));assert.ok(!noText.includes('不应出现的标题'));
    if(template.coverReady)assert.ok(noText.includes('text rule above takes absolute priority'));
    const figure=hooks.renderFigureRecipe(hooks.figureRecipe(template),{scene:'Two linked components',w:1200,h:800});
    assert.ok(figure.includes('1200 x 800'));assert.ok(figure.includes('Never use the article title as a headline'));
    assert.ok(!figure.includes('事实与观点'));assert.ok(!/\{(?:concept|width|height|ratio|text_rule)\}/.test(figure));
    const preview=hooks.BDView.prototype.templatePreview.call({},template);
    if(template.coverPreviewKind==='typeset-example'){assert.ok(preview.startsWith('data:image/svg+xml;'));assert.ok(decodeURIComponent(preview).includes('<svg'));}
    else if(template.coverReady){assert.ok(preview.startsWith('data:image/webp;'));assert.equal(template.coverPreviewKind,'generated-sample');}
    else {assert.ok(preview.startsWith('data:image/svg+xml;'));assert.ok(decodeURIComponent(preview).includes('构图示意'));}
    const bodyPreview=hooks.BDView.prototype.templatePreview.call({},template,'figure');assert.ok(bodyPreview.startsWith('data:image/svg+xml;'));
  }
});
test('catalog expansion preserves user overrides, copied templates and legacy IDs without mutating settings',()=>{
  const settings={promptTemplates:[{id:'gpt-paper-world',name:'我的纸雕',planningPrompt:'My plan',imagePrompt:'My image'},{id:'private-copy',name:'个人模板',planningPrompt:'Private plan',imagePrompt:'Private image'}]};
  const before=JSON.stringify(settings),templates=hooks.promptTemplates(settings);
  assert.equal(templates.length,39);assert.equal(new Set(templates.map(t=>t.id)).size,39);
  assert.equal(templates.find(t=>t.id==='gpt-paper-world').imagePrompt,'My image');
  for(const id of ['blank','dan-koe','neon-card','private-copy'])assert.ok(templates.some(t=>t.id===id));
  assert.equal(JSON.stringify(settings),before);
});

test('cover library separates validated covers from body diagrams while preserving active and custom choices',()=>{
  const settings={promptTemplates:[]};
  const covers=hooks.templateChoices(settings,'cover');assert.equal(covers.length,30);
  for(const id of ['gpt-concept-type','gpt-cinematic-story','gpt-object-editorial','gpt-human-narrative','gpt-opinion-collage','gpt-documentary-lens','gpt-literary-painting','dan-koe','neon-card','blank'])assert.ok(covers.some(t=>t.id===id));
  assert.ok(!covers.some(t=>t.id==='gpt-knowledge-flow'));
  assert.equal(hooks.templateChoices(settings,'figure').length,38);
  assert.ok(hooks.templateChoices(settings,'cover','gpt-knowledge-flow').some(t=>t.id==='gpt-knowledge-flow'));
  const custom={promptTemplates:[{id:'gpt-paper-world',name:'我的纸雕',planningPrompt:'My plan',imagePrompt:'My image'}]};
  assert.ok(hooks.templateChoices(custom,'cover').some(t=>t.id==='gpt-paper-world'));
});

test('interface language follows Obsidian, persists explicit choices and rolls back failed saves',async()=>{
  const Plugin=load(path.join(root,'main.js'),true);
  const app={vault:{adapter:{exists:async()=>true,mkdir:async()=>{}},on:()=>({})},workspace:{on:()=>({})}};
  const plugin=new Plugin(app);await plugin.onload();
  assert.equal(plugin.settings.language,'auto');assert.equal(plugin.commands[0].name,'打开配图工作台');
  let redraws=0;plugin.view={render(){redraws++;}};
  const before=JSON.stringify({...plugin.settings,language:null});
  await plugin.setLanguage('en');assert.equal(plugin.saved.language,'en');assert.equal(plugin.commands[0].name,'Open illustration workspace');assert.equal(redraws,1);
  assert.equal(JSON.stringify({...plugin.settings,language:null}),before);
  const persistedEnglish=JSON.parse(JSON.stringify(plugin.saved));
  hostLanguage='en';await plugin.setLanguage('auto');assert.equal(plugin.commands[0].name,'Open illustration workspace');
  hostLanguage='zh-TW';await plugin.setLanguage('auto');assert.equal(plugin.commands[0].name,'打开配图工作台');
  plugin.saveData=async()=>{throw new Error('fixture save failure');};
  await assert.rejects(plugin.setLanguage('en'),/fixture save failure/);assert.equal(plugin.settings.language,'auto');assert.equal(plugin.commands[0].name,'打开配图工作台');
  plugin.view.busy=true;await assert.rejects(plugin.setLanguage('en'));assert.equal(plugin.settings.language,'auto');
  plugin.view=null;plugin.onunload();hostLanguage='zh-CN';
  const reloaded=new Plugin(app);reloaded.saved=persistedEnglish;await reloaded.onload();assert.equal(reloaded.commands[0].name,'Open illustration workspace');reloaded.onunload();
});

test('English labels cover built-in options while custom text, prompts and output paths remain unchanged',()=>{
  const settings={promptTemplates:[]};let language='zh';i18n.configureLocale(()=>language,()=>hostLanguage);
  const template=hooks.promptTemplates(settings).find(t=>t.id==='gpt-literary-painting');
  const state={platform:'custom',customW:1600,customH:640,textLevel:'title'};
  const title='审美不够，怎么用 AI 做出更有质感的产品？';
  const prompt=hooks.renderTemplatePrompt(template,state,title,'A quiet scene');
  const task=JSON.stringify(hooks.createOutputTask({},null,'配图',true));
  language='en';assert.equal(hooks.templateLabel(template,settings),'Literary painting · Poetic space');
  const custom={promptTemplates:[{...template,name:'文学绘画 · 留白意象',description:'保留我的原话'}]};
  assert.equal(hooks.templateLabel(custom.promptTemplates[0],custom),'文学绘画 · 留白意象');assert.equal(hooks.templateLabel(custom.promptTemplates[0],custom,'description'),'保留我的原话');
  assert.equal(hooks.renderTemplatePrompt(template,state,title,'A quiet scene'),prompt);assert.equal(JSON.stringify(hooks.createOutputTask({},null,'配图',true)),task);
  for(const item of [...hooks.promptTemplates(settings),...hooks.PLATFORMS,...hooks.FIGURE_SIZES,...hooks.PALETTES,...hooks.RENDERINGS])for(const key of ['name','description','note','sourceLabel'])if(item[key]&&/[\u4e00-\u9fff]/.test(item[key]))assert.ok(Object.hasOwn(i18n.EN,item[key]),item[key]);
  for(const [,label]of services.GROUPS)if(/[\u4e00-\u9fff]/.test(label))assert.ok(Object.hasOwn(i18n.EN,label),label);
  for(const kind of ['text','image'])for(const provider of services.providers(kind))if(/[\u4e00-\u9fff]/.test(provider.name))assert.ok(Object.hasOwn(i18n.EN,provider.name),provider.name);
  assert.equal(i18n.t('已读取 {count} 个模型，可选择或直接输入',{count:12}),'Loaded 12 models. Select one or enter a name.');
  assert.equal(i18n.imageCount(1),'1 image');assert.equal(i18n.imageCount(2),'2 images');
  assert.equal(i18n.t('未知的个人名称'),'未知的个人名称');assert.equal(i18n.t('视觉提示词需包含 {concept}，让文章构思进入画面'),'Include {concept} in the image prompt to use the article concept');
  language='zh';assert.equal(i18n.t('构思与规划'),'构思与规划');assert.equal(i18n.imageCount(1),'1 张');assert.equal(i18n.resolveLanguage('auto','fr'),'en');assert.equal(i18n.resolveLanguage('zh','en-US'),'zh');
});


test('hidden templates preserve active choices and blank remains first in both libraries',()=>{
  const settings={promptTemplates:[],hiddenPromptTemplates:['blank','editorial-list','dan-koe']};
  for(const scope of ['cover','figure']) {
    const ids=hooks.templateChoices(settings,scope).map(item=>item.id);
    assert.equal(ids[0],'blank');assert.ok(!ids.includes('editorial-list'));assert.ok(!ids.includes('dan-koe'));
    assert.ok(hooks.templateChoices(settings,scope,'editorial-list').some(item=>item.id==='editorial-list'));
  }
  assert.ok(hooks.promptTemplates(settings).some(item=>item.id==='editorial-list'));
});
test('template management saves preferences atomically and rolls back a failed write',async()=>{
  const custom={id:'custom-fixture',name:'My style',planningPrompt:'Original plan',imagePrompt:'Original {concept}'};
  const plugin={settings:{promptTemplates:[custom],deletedPromptTemplates:[],sessions:{'Fixture.md':{state:{templateId:'blank'}}},modelServices:{textId:'private-connection'}},async saveSettings(){this.saved=JSON.parse(JSON.stringify(this.settings));}};
  const preserved=JSON.stringify({sessions:plugin.settings.sessions,modelServices:plugin.settings.modelServices});
  await hooks.updateTemplateSettings(plugin,data=>{data.hiddenPromptTemplates=['editorial-list'];});
  assert.deepEqual(plugin.saved.hiddenPromptTemplates,['editorial-list']);
  const before=JSON.stringify(plugin.settings);
  plugin.saveSettings=async()=>{throw new Error('fixture write failure');};
  await assert.rejects(hooks.updateTemplateSettings(plugin,data=>{data.promptTemplates=[];data.deletedPromptTemplates=[custom];data.hiddenPromptTemplates=[];}),/fixture write failure/);
  assert.equal(JSON.stringify(plugin.settings),before);
  assert.equal(JSON.stringify({sessions:plugin.settings.sessions,modelServices:plugin.settings.modelServices}),preserved);
});

test('management controls hide, show, delete and restore; saving a copy keeps the active template',async()=>{
  i18n.configureLocale(()=>'zh');
  class Element {
    constructor(tag='div',options={}){this.tag=tag;this.children=[];this.value='';this.options=options;this.text=options.text||'';this.disabled=false;}
    createEl(tag,options={}){const el=new Element(tag,options);if(options.value)el.value=options.value;this.children.push(el);if(this.tag==='select'&&this.children.length===1)this.value=options.value;return el;}
    createDiv(options={}){return this.createEl('div',typeof options==='string'?{cls:options}:options);}
    createSpan(options={}){return this.createEl('span',options);}
    setText(text){this.text=text;} empty(){this.children=[];} addClass(){} toggleClass(){}
    all(){return [this,...this.children.flatMap(child=>child.all())];}
  }
  const custom={id:'custom-fixture',name:'Fixture',description:'Keep this description',planningPrompt:'Original plan',imagePrompt:'Original {concept}'};
  const plugin={settings:{promptTemplates:[custom],hiddenPromptTemplates:[],deletedPromptTemplates:[],modelServices:{textId:'untouched'}},async saveSettings(){this.saved=JSON.parse(JSON.stringify(this.settings));}};
  let active='blank',returned=0;
  const view={app:{},plugin,template(){return hooks.promptTemplates(plugin.settings).find(item=>item.id===active);},templateLabel(template,field='name'){return hooks.templateLabel(template,plugin.settings,field);},selectTemplate(id){active=id;},remember(){},renderBody(){}};
  const mount=modal=>{modal.titleEl=new Element();modal.modalEl=new Element();modal.contentEl=new Element();modal.close=()=>modal.onClose();modal.onOpen();return modal;};
  const manager=mount(new hooks.TemplateManagerModal(view));
  const action=label=>manager.contentEl.all().find(el=>el.options.attr?.['aria-label']===label);
  assert.equal(action('隐藏模板: 空白模板').disabled,true);
  await action('隐藏模板: 清单榜单 · 数字焦点').onclick();assert.ok(plugin.saved.hiddenPromptTemplates.includes('editorial-list'));
  manager.filter.value='hidden';manager.filter.onchange();assert.equal(manager.list.children.length,1);
  await action('显示模板: 清单榜单 · 数字焦点').onclick();assert.equal(manager.list.children.length,1);assert.equal(manager.list.children[0].text,'没有匹配的模板');
  manager.filter.value='custom';manager.filter.onchange();active='custom-fixture';await action('删除模板: Fixture').onclick();assert.equal(plugin.settings.promptTemplates.length,0);assert.equal(active,'blank');
  await manager.restore.onclick();assert.equal(plugin.settings.promptTemplates[0].description,'Keep this description');
  const editor=mount(new hooks.PromptTemplateEditor(view,custom,true,'cover',()=>returned++));
  const field=label=>editor.contentEl.all().find(el=>el.options.attr?.['aria-label']===label);
  field('模板名称').value='Copied style';field('模板说明').value='Updated description';
  await editor.contentEl.all().find(el=>el.tag==='button'&&el.text==='保存模板').onclick();
  const saved=plugin.settings.promptTemplates.find(item=>item.name==='Copied style');
  assert.equal(saved.description,'Updated description');assert.equal(saved.imagePrompt,'Original {concept}');
  assert.equal(custom.name,'Fixture');assert.equal(custom.description,'Keep this description');
  assert.equal(active,'blank');assert.equal(returned,1);assert.equal(plugin.settings.modelServices.textId,'untouched');
});


test('thirty cover choices include fourteen traceable directions with article-independent offline examples',()=>{
  const report=require('../assets/template-research.json');
  const {RESEARCHED_TEMPLATES}=require('../src/templates/researched');
  assert.equal(RESEARCHED_TEMPLATES.length,14);assert.equal(report.directions.length,14);
  const covers=hooks.templateChoices({promptTemplates:[]},'cover');
  assert.equal(covers.length,30);assert.equal(covers[0].id,'blank');
  const sources=new Set(report.sources.map(source=>source.id));
  const samples=new Set();
  for(const template of RESEARCHED_TEMPLATES){
    assert.ok(covers.some(item=>item.id===template.id));
    const provenance=report.directions.find(item=>item.id===template.id);
    assert.equal(provenance.sourceUrl,template.sourceUrl);assert.match(template.sourceUrl,/^https:\/\//);
    assert.ok(provenance.selection_reason);assert.ok(template.researchSourceIds.every(id=>sources.has(id)));
    assert.ok(!samples.has(template.sampleTitle));samples.add(template.sampleTitle);
    assert.equal(template.coverPreviewKind,'typeset-example');
    assert.ok(template.coverPreviewSvg.includes('<svg'));assert.ok(!/(?:<script|<image|(?:href|src)=|url\(["']?https?:)/.test(template.coverPreviewSvg));
    const prompt=hooks.renderTemplatePrompt(template,{platform:'custom',customW:900,customH:383,textLevel:'title'},'当前文章的完整标题','An article-specific scene');
    assert.ok(prompt.includes('当前文章的完整标题'));assert.ok(prompt.includes('900 x 383'));
    assert.ok(!prompt.includes(template.sampleTitle));assert.ok(!template.planningPrompt.includes(template.sampleTitle));
    const blank=hooks.renderTemplatePrompt(template,{platform:'custom',customW:1080,customH:1440,textLevel:'none'},'不应进入无字封面','A single original object');
    assert.ok(blank.includes('1080 x 1440'));assert.ok(blank.includes('Do not render any text'));assert.ok(!blank.includes('不应进入无字封面'));
  }
  const github=report.sources.filter(source=>source.kind==='github');
  assert.ok(github.length>=7);assert.ok(github.filter(source=>source.stars>=10000).length>=4);
});

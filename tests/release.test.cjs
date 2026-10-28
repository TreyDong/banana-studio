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
class HostMenu {
  constructor(){HostMenu.last=this;this.items=[];}
  addItem(fn){const item={};for(const key of ['Title','Icon','Checked','Disabled','IsLabel'])item['set'+key]=value=>{item[key.toLowerCase()]=value;return item;};item.onClick=fn=>{item.click=fn;return item;};fn(item);this.items.push(item);return this;}
  addSeparator(){this.items.push({separator:true});return this;}
  setUseNativeMenu(value){this.native=value;return this;}
  onHide(fn){this.hideCallback=fn;}
  showAtPosition(){this.shown=true;}
}
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
const host = {arrayBufferToBase64:buffer=>Buffer.from(buffer).toString('base64'),getLanguage:()=>hostLanguage,Plugin:HostPlugin,ItemView:class{},PluginSettingTab:class{},Modal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},FuzzySuggestModal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},TFile:class{},MarkdownView:class{},Menu:HostMenu,Notice:class{},normalizePath:s=>s.replace(/\\/g,'/'),setIcon(){}};
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
  vm.runInNewContext(source,{module:mod,exports:mod.exports,require:safeRequire,Buffer,URL,Blob,process,console,setTimeout,clearTimeout,AbortController,requestAnimationFrame(){},document:{getElementById:()=>null}},{filename});
  return mod.exports;
}
const sourcePlugin=load(path.join(root,'src/main.js'),true);
const hooks=sourcePlugin.testHooks;
function flowNode(options={}) {
  const node={text:options.text||'',children:[],attrs:{...options.attr},value:'',isConnected:true,setAttribute(k,v){this.attrs[k]=v;},empty(){this.children=[];},addClass(){}};
  for(const method of ['createEl','createDiv','createSpan']) node[method]=(...args)=>{const opts=method==='createEl'?(args[1]||{}):(typeof args[0]==='object'?args[0]:{});const child=flowNode(opts);node.children.push(child);return child;};
  return node;
}
function flowText(node){return [node.text,...node.children.map(flowText)].join(' ');}
function flowView(overrides={}) {
  return Object.assign(Object.create(hooks.BDView.prototype),{plugin:{settings:{}},figures:[],refs:[],figureRequirements:'',activeFile:()=>({path:'Flow.md'}),remember(){},renderStopButton:()=>null,navigateTab(key){this.destination=key;},...overrides});
}
test('chosen planning and image services and model names are visible without hovering',()=>{
  i18n.configureLocale(()=>'zh'); const parent=flowNode();
  const view=flowView({plugin:{activeConnection:kind=>({name:kind==='text'?'Planning Service':'Local Gemini',model:kind==='text'?'planner-v2':'gemini-image'})}});
  const picker=view.renderModelPicker(parent);
  assert.match(flowText(parent),/Planning Service · planner-v2/);assert.match(flowText(parent),/Local Gemini · gemini-image/);
  assert.equal(picker.attrs['aria-haspopup'],'menu');view.busy=true;assert.equal(view.renderModelPicker(flowNode()).disabled,true);
});
test('the complete cover composer renders the selected models and locks them with its controls',()=>{
  const view=flowView({coverChat:[],coverChatDraft:'',coverCount:1,coverBatch:[],plugin:{settings:{},activeConnection:()=>({name:'Selected service',model:'chosen-model'})},templatePickerLabel:()=> 'Style',canGenerateCover:()=>true});
  const panel=flowNode(),fields=flowNode();view.renderCoverConversation(panel,fields);
  assert.match(flowText(panel),/Selected service · chosen-model/);assert.match(flowText(panel),/生成/);
  view.busy=true;const locked=flowNode();view.renderCoverConversation(locked,flowNode());
  function all(n){return [n,...n.children.flatMap(all)];}
  const picker=all(locked).find(n=>n.attrs['aria-haspopup']==='menu'&&/Selected service/.test(n.attrs['aria-label']||''));assert.equal(picker.disabled,true);
});
test('global history includes both modes across articles and uses current unsaved results',()=>{
  const files=new Map(['Old.md','Current.md','old.png','manual.png','live.png'].map(path=>[path,{path,extension:path.endsWith('.md')?'md':'png'}]));
  const view=flowView({articlePath:'Current.md',title:'Current',covers:[{vaultPath:'live.png'}],figures:[],app:{vault:{getAbstractFileByPath:p=>files.get(p)}},plugin:{settings:{sessions:{'Old.md':{title:'Old',covers:[{vaultPath:'old.png'},{vaultPath:'missing.png'}],figures:[{mode:'manual',vaultPath:'manual.png'}]},'Current.md':{covers:[]},'Deleted.md':{covers:[{vaultPath:'old.png'}]}}}}});
  const entries=view.savedGenerations();assert.equal(entries.length,3);assert.equal(entries.find(e=>e.path==='Current.md').count,1);assert.equal(entries.find(e=>e.mode==='manual').path,'Old.md');assert.ok(entries.every(e=>e.count===1));
});
test('history routing saves the current article before loading another and guards running work',async()=>{
  let loaded=0,selected=0;
  const view=flowView({articlePath:'Current.md',app:{vault:{getAbstractFileByPath:()=>({path:'Old.md',extension:'md'})}},useArticle(file){loaded++;this.articlePath=file.path;this.covers=[{vaultPath:'old.png'}];},selectCover(item){selected++;this.cover=item;}});
  await view.openSavedGeneration({path:'Old.md',type:'cover'});assert.equal(loaded,1);assert.equal(selected,1);assert.equal(view.destination,'cover');assert.equal(view.coverBatch.length,1);assert.equal(view.coverBatch[0].vaultPath,'old.png');
  view.busy=true;await view.openSavedGeneration({path:'Else.md',type:'figure',mode:'agent'});assert.equal(loaded,1);
});
test('article history switches between manual and AI batches even from the opposite mode',async()=>{
  i18n.configureLocale(()=>'zh');const agent={planId:'p',mode:'agent',vaultPath:'a.png',title:'AI'},manual={batchId:'m',mode:'manual',vaultPath:'m.png'};
  const view=flowView({figureMode:'agent',figurePlan:{id:'p'},figures:[agent,manual],renderBody(){}});
  view.openFigureHistory({getBoundingClientRect:()=>({left:0,bottom:0})});
  const choices=HostMenu.last.items.filter(i=>i.click);assert.equal(choices.length,2);
  await choices[0].click();assert.equal(view.figureMode,'manual');assert.equal(view.manualBatchId,'m');
  await choices[1].click();assert.equal(view.figureMode,'agent');
});
test('requirements are editable before planning and insertion leads to article preview',async()=>{
  i18n.configureLocale(()=>'zh');let view=flowView(),panel=flowNode(),fields=flowNode();
  view.renderFigureAgent(panel,fields,[]);assert.match(flowText(fields),/配图要求（可选）/);
  const input=fields.children[0].children.find(c=>c.attrs['aria-label']);input.value='Only two diagrams';input.oninput();assert.equal(view.figureRequirements,'Only two diagrams');
  view=flowView({figurePlan:{phase:'inserted',summary:'Complete'}});panel=flowNode();view.renderFigureAgent(panel,flowNode(),[]);
  const footer=panel.children[0],preview=footer.children.find(n=>flowText(n).trim()==='预览文章');assert.ok(preview);await preview.onclick();assert.equal(view.destination,'article');
});
test('preview explains uninserted images and offers a return path without modifying the article',async()=>{
  i18n.configureLocale(()=>'zh');const view=flowView({figurePlan:{id:'p',phase:'ready'},figures:[{planId:'p',vaultPath:'a.png'}]}),parent=flowNode();
  view.renderPendingFigures(parent);assert.match(flowText(parent),/尚未插入/);await parent.children[0].children[1].onclick();assert.equal(view.destination,'figure');
  view.figurePlan.phase='inserted';const clean=flowNode();view.renderPendingFigures(clean);assert.equal(clean.children.length,0);
});
test('confirming generated images replaces reserved positions before the inserted state is saved',async()=>{
  const source='# Flow\n\nFirst paragraph.\n',blocks=figures.articleBlocks(source),fg={mode:'agent',planId:'p',sourcePath:'Flow.md',anchor:figures.makeAnchor(blocks[0],blocks,'Flow.md',source),placeholder:figures.placeholderFor('p',0),status:'done',vaultPath:'images/a.png'};
  let content=figures.preparePlaceholders(source,[fg],'Flow.md').content,saved;
  const view=flowView({figurePlan:{id:'p',phase:'ready'},figures:[fg],app:{vault:{getAbstractFileByPath:()=>({}),async process(file,fn){content=fn(content);}}},plugin:{figureAgent:figures},render(){},async persistFigures(){saved=this.figurePlan.phase;}});
  await view.confirmAgentFigures();assert.match(content,/!\[\[images\/a.png\]\]/);assert.equal(saved,'inserted');assert.equal(view.figurePlan.phase,'inserted');assert.equal(view.insertingFigures,false);
});
test('article and channel content hide owned reserved markers without changing saved text',async()=>{
  const source='# Flow\n\nFirst paragraph.\n\nSecond paragraph.\n',blocks=figures.articleBlocks(source),fg={sourcePath:'Flow.md',planId:'p',mode:'agent',anchor:figures.makeAnchor(blocks[0],blocks,'Flow.md',source),placeholder:figures.placeholderFor('p',0)};
  const marked=figures.preparePlaceholders(source,[fg],'Flow.md').content;
  const view=flowView({title:'Flow',figurePlan:{id:'p'},figures:[fg],app:{vault:{cachedRead:async()=>marked}},plugin:{figureAgent:figures}});
  const preview=await view.articleMarkdown({path:'Flow.md'}),channel=await view.wechatMarkdown({path:'Flow.md'});
  assert.ok(!preview.includes(fg.placeholder));assert.ok(!channel.includes(fg.placeholder));assert.match(preview,/First paragraph/);assert.match(channel,/Second paragraph/);assert.ok(marked.includes(fg.placeholder));
});
test('sandboxed WeChat preview embeds vault image bytes while keeping sandbox restrictions',async()=>{
  const stage=flowNode(),formatted={html:'<img src="IMAGE0"><p>Text</p>',images:['assets/a.webp']};
  const view=flowView({app:{vault:{readBinary:async()=>Buffer.from('fixture')}},plugin:{wechatFormatter:{imagePlaceholder:()=> 'IMAGE0'}},wechatFormatted:async()=>formatted,resolveVaultImage:()=>({extension:'webp'})});
  await view.renderWechatPreview(stage,{path:'Flow.md'});
  const frame=stage.children[0].children[0];assert.match(frame.srcdoc,/data:image\/webp;base64,Zml4dHVyZQ==/);assert.equal(frame.attrs.sandbox,'');assert.equal(formatted.html,'<img src="IMAGE0"><p>Text</p>');
});
test('ribbon launch captures the active note before focusing a new or existing workbench',async()=>{
  for(const existing of [false,true]){
    let active={path:'Current.md',extension:'md'},selected,revealed=false;
    const leaf={view:{refreshForFile(file){selected=file;return true;}},async setViewState(){active=null;}};
    const plugin={lastMarkdownPath:'Old.md',app:{vault:{getAbstractFileByPath:()=>({path:'Old.md',extension:'md'})},workspace:{getActiveFile:()=>active,getLeavesOfType:()=>existing?[leaf]:[],getLeaf:()=>leaf,revealLeaf(){revealed=true;}}}};
    await sourcePlugin.prototype.activateView.call(plugin);
    assert.equal(selected.path,'Current.md');assert.equal(plugin.lastMarkdownPath,'Current.md');assert.equal(revealed,true);
  }
});
test('opening the workbench prefers a recently focused note over its old remembered article',async()=>{
  let selected;const recent={path:'Recent.md',extension:'md'},old={path:'Old.md',extension:'md'};
  const view={plugin:{lastMarkdownPath:'Recent.md',settings:{lastArticle:'Old.md'}},app:{workspace:{getActiveFile:()=>null,getLeavesOfType:()=>[]},vault:{getAbstractFileByPath:p=>p==='Recent.md'?recent:old}},useArticle(file){selected=file;},render(){}};
  await hooks.BDView.prototype.onOpen.call(view);assert.equal(selected,recent);
});
test('launching while busy keeps the job article; selecting it again preserves the draft',()=>{
  const file={path:'Current.md',extension:'md'},view={articlePath:file.path,busy:true,useArticle(){throw new Error('Draft was reset');}};
  assert.equal(hooks.BDView.prototype.refreshForFile.call(view,file),true);
  assert.equal(hooks.BDView.prototype.refreshForFile.call(view,{path:'Other.md',extension:'md'}),false);
});
test('local references import multiple images using note attachment paths without replacing existing files',async()=>{
  const png=Buffer.from('89504e470d0a1a0a','hex'),files=new Map([['assets/photo.png','original']]),requested=[];
  const view={articlePath:'Notes/Current.md',refs:[],activeFile:()=>({path:'Notes/Current.md'}),render(){},remember(){this.saved=this.refs.map(f=>f.path);},app:{fileManager:{async getAvailablePathForAttachment(name,source){requested.push(source);let dest='assets/'+name,n=1;while(files.has(dest))dest='assets/'+n+++'-'+name;return dest;}},vault:{async createBinary(dest,data){assert.equal(files.has(dest),false);files.set(dest,data);return {path:dest,extension:'png'};}}}};
  const fixture=()=>({name:'photo.png',size:png.length,async arrayBuffer(){return Uint8Array.from(png).buffer;}});
  const added=await hooks.BDView.prototype.addLocalReferences.call(view,[fixture(),fixture()],view.articlePath);
  assert.equal(added.length,2);assert.equal(files.get('assets/photo.png'),'original');assert.equal(requested.join(','),'Notes/Current.md,Notes/Current.md');assert.equal(view.saved.length,2);assert.equal(view.busy,false);
});
test('local reference selection handles cancellation, changed articles, unsupported files and oversized files',async()=>{
  i18n.configureLocale(()=>'zh');
  let reads=0,writes=0;
  const view={articlePath:'Current.md',refs:[],activeFile:()=>({}),render(){},remember(){},app:{fileManager:{getAvailablePathForAttachment(){writes++;}},vault:{}}};
  assert.equal((await hooks.BDView.prototype.addLocalReferences.call(view,[],view.articlePath)).length,0);
  await assert.rejects(hooks.BDView.prototype.addLocalReferences.call(view,[{}],'Old.md'),/重新添加/);
  const bad=[{name:'text.png',size:4,arrayBuffer:async()=>Uint8Array.from([1,2,3,4]).buffer},{name:'large.png',size:61*1024*1024,arrayBuffer(){reads++;}}];
  assert.equal((await hooks.BDView.prototype.addLocalReferences.call(view,bad,view.articlePath)).length,0);assert.equal(writes,0);assert.equal(reads,0);assert.match(view.error,/PNG/);assert.match(view.error,/60 MB/);assert.equal(view.busy,false);
});
test('the reference button opens a multi-image local picker rather than scanning the vault',()=>{
  let clicked=false,received;const input={click(){clicked=true;}};
  const view={articlePath:'Current.md',activeFile:()=>({}),contentEl:{ownerDocument:{createElement:()=>input}},addLocalReferences(files,source){received={files,source};return Promise.resolve([]);}};
  hooks.BDView.prototype.pickLocalReferences.call(view);assert.equal(clicked,true);assert.equal(input.type,'file');assert.equal(input.multiple,true);assert.match(input.accept,/image\/webp/);
  input.files=[{name:'fixture.png'}];input.onchange();assert.equal(received.source,'Current.md');assert.equal(received.files[0].name,'fixture.png');
});
test('article references persist, ignore temporary job refs, and restore only existing images',()=>{
  const image={path:'assets/ref.png',extension:'png'},text={path:'private.md',extension:'md'};
  const plugin={settings:{sessions:{}},saveSettings:async()=>{},wechatThemes:require('../src/templates/wechat-themes')};
  const view=new hooks.BDView({},plugin);view.app={metadataCache:{getFileCache:()=>null},vault:{getAbstractFileByPath:p=>p===image.path?image:p===text.path?text:null}};view.articlePath='Current.md';view.title='Current';view.refs=[image];
  view.remember();assert.equal(plugin.settings.sessions['Current.md'].referencePaths.join(','),image.path);
  view.busy=true;view.refs.push({path:'temporary-cover.png'});view.remember();assert.equal(plugin.settings.sessions['Current.md'].referencePaths.join(','),image.path);
  view.busy=false;clearTimeout(view.saveTimer);view.articlePath='';plugin.settings.sessions['Current.md'].referencePaths.push('missing.png',text.path,image.path);
  view.useArticle({path:'Current.md',basename:'Current',extension:'md'},false);assert.equal(view.refs.length,1);assert.equal(view.refs[0],image);clearTimeout(view.saveTimer);
});
test('an open model menu cannot change a running job and reselecting the current service does not save',async()=>{
  i18n.configureLocale(()=>'zh');let saves=0,renders=0;
  const plugin={settings:{modelServices:{textId:'current',imageId:'image',text:[{id:'current',name:'Current'},{id:'other',name:'Other'}],image:[{id:'image',name:'Image'}]}},async selectConnection(kind,id){saves++;this.settings.modelServices[kind+'Id']=id;}};
  const attrs={},anchor={getBoundingClientRect:()=>({left:0,bottom:0}),setAttribute:(k,v)=>attrs[k]=v};
  const view={plugin,renderBody(){renders++;}};
  hooks.BDView.prototype.openModelMenu.call(view,anchor);
  const menu=HostMenu.last,choices=menu.items.filter(item=>item.click&&item.title.includes(' · '));
  assert.equal(attrs['aria-expanded'],'true');assert.equal(choices[0].checked,true);
  await choices[0].click();assert.equal(saves,0);
  view.busy=true;await choices[1].click();assert.equal(saves,0);assert.equal(plugin.settings.modelServices.textId,'current');
  view.busy=false;await choices[1].click();assert.equal(saves,1);assert.equal(renders,1);assert.equal(plugin.settings.modelServices.textId,'other');
  menu.hideCallback();assert.equal(attrs['aria-expanded'],'false');
});
test('an open cover history menu cannot replace the cover after a task starts',()=>{
  const image={vaultPath:'old.png'},view={covers:[image],cover:null,selectCover(){throw new Error('Stale menu changed cover');}};
  hooks.BDView.prototype.openCoverHistory.call(view,{getBoundingClientRect:()=>({left:0,bottom:0})});
  view.busy=true;HostMenu.last.items[0].click();assert.equal(view.cover,null);
});
test('context navigation arrows wrap within its group and busy tabs stay locked',()=>{
  let buttons=[],active='article',focused;
  const app={createDiv:()=>({setAttribute(){}})};
  const view={button(parent,text,fn){const b={attrs:{},setAttribute(k,v){this.attrs[k]=v;},click(){if(!this.disabled)fn();},focus(){focused=this;}};buttons.push(b);return b;}};
  const render=()=>{buttons=[];hooks.BDView.prototype.renderTabGroup.call(view,app,[['article','Article'],['wechat','WeChat'],['x','X']],active,'bd-context-tabs','Preview',key=>{active=key;render();buttons.find(b=>b.tabIndex===0).focus();});};render();
  const key=key=>{let prevented=false;buttons.find(b=>b.tabIndex===0).onkeydown({key,preventDefault(){prevented=true;}});return prevented;};
  assert.equal(key('ArrowLeft'),true);assert.equal(active,'x');assert.equal(focused,buttons[2]);
  key('ArrowRight');assert.equal(active,'article');key('End');assert.equal(active,'x');key('Home');assert.equal(active,'article');
  assert.equal(key('Tab'),false);assert.equal(buttons.filter(b=>b.tabIndex===0).length,1);
  view.operation={};render();assert.equal(key('ArrowRight'),false);assert.equal(active,'article');
});
test('workflow navigation remembers each section and preserves drafts, plans and publication edits',()=>{
  const groups=new Map(),drafts={coverChatDraft:'Keep my brief',figurePlan:{id:'plan',phase:'draft'},xTweets:[{text:'Edited tweet'}]};let focus;
  const view={...drafts,tab:'cover',createTab:'cover',publishTab:'article',renderTabGroup(parent,items,active,cls,label,select){groups.set(cls,{items,active,select});},contentEl:{querySelector(selector){focus=selector;return {focus(){}};}},navigateTab:hooks.BDView.prototype.navigateTab,render(){groups.clear();hooks.BDView.prototype.renderTabs.call(this,app);}};
  const app={createDiv:()=>({createSpan(){}})};view.render();
  assert.equal(groups.get('bd-workflow-tabs').items.length,2);assert.equal(groups.get('bd-context-tabs').items.length,2);
  groups.get('bd-workflow-tabs').select('publish');assert.equal(view.tab,'article');assert.equal(groups.get('bd-context-tabs').items.length,3);assert.equal(focus,'.bd-workflow-tabs .is-active');
  groups.get('bd-context-tabs').select('x');groups.get('bd-workflow-tabs').select('create');assert.equal(view.tab,'cover');
  groups.get('bd-context-tabs').select('figure');groups.get('bd-workflow-tabs').select('publish');assert.equal(view.tab,'x');
  groups.get('bd-workflow-tabs').select('create');assert.equal(view.tab,'figure');
  assert.equal(view.coverChatDraft,drafts.coverChatDraft);assert.equal(view.figurePlan,drafts.figurePlan);assert.equal(view.xTweets,drafts.xTweets);
});
test('workflow navigation rejects busy transitions and invalid targets without touching active work',()=>{
  for(const block of ['busy','coverChatBusy','insertingFigures','operation']){
    const view={tab:'cover',[block]:true,render(){throw new Error('Busy work was replaced');}};
    assert.equal(hooks.BDView.prototype.navigateTab.call(view,'article'),false);assert.equal(view.tab,'cover');
  }
  assert.equal(hooks.BDView.prototype.navigateTab.call({render(){throw new Error('Invalid route');}},'unknown'),false);
});
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
    const styles=Plugin.testHooks.promptTemplates({promptTemplates:[]}).filter(item=>item.coverPreviewSheet);
    assert.equal(styles.length,30);
    for(const template of styles){
      const preview=Plugin.testHooks.BDView.prototype.templatePreview.call({},template);
      assert.ok(Plugin.testHooks.BDView.prototype.templatePreview.call({},template,'figure')===preview,'Bundled body style preview must load without sibling assets: '+template.id);
      assert.match(preview,/^data:image\/svg\+xml;charset=utf-8,/);
      const svg=decodeURIComponent(preview.split(',').slice(1).join(','));
      assert.match(svg,/<image[^>]+href="data:image\/webp;base64,/);
      assert.ok(!/href="(?:https?:|file:|app:)/.test(svg));
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
test('body template library shows available style samples instead of generic layout placeholders',()=>{
  const templates=hooks.promptTemplates({promptTemplates:[]}).filter(item=>item.coverPreviewAsset||item.coverPreviewSheet||item.coverPreviewSvg||item.previewAsset);
  assert.equal(templates.length,59);
  for(const template of templates){
    const cover=hooks.BDView.prototype.templatePreview.call({},template,'cover');
    const body=hooks.BDView.prototype.templatePreview.call({},template,'figure');
    assert.ok(body===cover,'Body picker must retain the visual style sample: '+template.id);
    if(body.startsWith('data:image/svg+xml;'))assert.ok(!/SCENE STUDY|LAYOUT STUDY/.test(decodeURIComponent(body)));
  }
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
  assert.equal(EXTRA_TEMPLATES.length,65);
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
    if(template.coverPreviewKind==='typeset-example'||template.coverPreviewKind==='generated-style-sample'){assert.ok(preview.startsWith('data:image/svg+xml;'));assert.ok(decodeURIComponent(preview).includes('<svg'));}
    else if(template.coverReady){assert.ok(preview.startsWith('data:image/webp;'));assert.equal(template.coverPreviewKind,'generated-sample');}
    else {assert.ok(preview.startsWith('data:image/svg+xml;'));assert.ok(decodeURIComponent(preview).includes('构图示意'));}
    const bodyPreview=hooks.BDView.prototype.templatePreview.call({},template,'figure');assert.match(bodyPreview,/^data:image\/(?:svg\+xml|webp);/);
  }
});
test('catalog expansion preserves user overrides, copied templates and legacy IDs without mutating settings',()=>{
  const settings={promptTemplates:[{id:'gpt-paper-world',name:'我的纸雕',planningPrompt:'My plan',imagePrompt:'My image'},{id:'private-copy',name:'个人模板',planningPrompt:'Private plan',imagePrompt:'Private image'}]};
  const before=JSON.stringify(settings),templates=hooks.promptTemplates(settings);
  assert.equal(templates.length,69);assert.equal(new Set(templates.map(t=>t.id)).size,69);
  assert.equal(templates.find(t=>t.id==='gpt-paper-world').imagePrompt,'My image');
  for(const id of ['blank','dan-koe','neon-card','private-copy'])assert.ok(templates.some(t=>t.id===id));
  assert.equal(JSON.stringify(settings),before);
});

test('cover library separates validated covers from body diagrams while preserving active and custom choices',()=>{
  const settings={promptTemplates:[]};
  const covers=hooks.templateChoices(settings,'cover');assert.equal(covers.length,60);
  for(const id of ['gpt-concept-type','gpt-cinematic-story','gpt-object-editorial','gpt-human-narrative','gpt-opinion-collage','gpt-documentary-lens','gpt-literary-painting','dan-koe','neon-card','blank'])assert.ok(covers.some(t=>t.id===id));
  assert.ok(!covers.some(t=>t.id==='gpt-knowledge-flow'));
  assert.equal(hooks.templateChoices(settings,'figure').length,68);
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


test('earlier thirty cover choices retain fourteen traceable directions with article-independent offline examples',()=>{
  const report=require('../assets/template-research.json');
  const {RESEARCHED_TEMPLATES}=require('../src/templates/researched');
  assert.equal(RESEARCHED_TEMPLATES.length,14);assert.equal(report.directions.length,14);
  const covers=hooks.templateChoices({promptTemplates:[]},'cover');
  assert.equal(covers.length,60);assert.equal(covers[0].id,'blank');
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

test('thirty added visual styles keep typography and composition in cover prompts and out of body hierarchy',()=>{
  const {STYLE_TEMPLATES,SAMPLE_TITLE}=require('../src/templates/styles');
  assert.equal(STYLE_TEMPLATES.length,30);
  for(const key of ['typography','composition','material'])assert.equal(new Set(STYLE_TEMPLATES.map(item=>item.styleProfile[key])).size,30);
  const state={platform:'custom',customW:1080,customH:1440,textLevel:'title'};
  for(const template of STYLE_TEMPLATES){
    const cover=hooks.renderTemplatePrompt(template,state,'当前文章，保持完整！','One original article-specific scene');
    assert.ok(cover.includes('当前文章，保持完整！'));assert.ok(cover.includes('1080 x 1440'));
    for(const rule of Object.values(template.styleProfile))assert.ok(cover.includes(rule));
    assert.ok(!cover.includes(SAMPLE_TITLE));assert.ok(!template.planningPrompt.includes(SAMPLE_TITLE));
    const noText=hooks.renderTemplatePrompt(template,{...state,textLevel:'none'},'不要泄漏这段标题','A quiet original scene');
    assert.ok(!noText.includes('不要泄漏这段标题'));assert.ok(noText.includes('remove ALL lettering'));
    const body=hooks.renderFigureRecipe(hooks.figureRecipe(template),{scene:'One meaningful paragraph scene',w:1200,h:800});
    assert.ok(body.includes(template.styleProfile.material));
    assert.ok(!body.includes(template.styleProfile.typography));assert.ok(!body.includes(template.styleProfile.composition));
    assert.ok(body.includes('Never use the article title as a headline'));
    assert.notEqual(i18n.translate(template.name,'en'),template.name);
    assert.notEqual(i18n.translate(template.description,'en'),template.description);
  }
  // These cover styles must be allowed their actual type systems, not a shared heavy-Heiti rule.
  for(const id of ['style-magazine','style-chinese','style-watercolor','style-pixel','style-clay','style-patchwork']){
    const prompt=hooks.renderTemplatePrompt(STYLE_TEMPLATES.find(item=>item.id===id),state,'中文与 AI，完整标题','An original scene');
    assert.ok(!prompt.includes('Typography: a clean modern Chinese sans-serif display headline, heavy Heiti'));
  }
});

test('generated style previews map thirty unique bounded cells to five offline sheets',()=>{
  const pack=require('../assets/style-previews.json');
  const {STYLE_TEMPLATES,stylePreview,SAMPLE_TITLE}=require('../src/templates/styles');
  assert.equal(pack.sampleTitle,SAMPLE_TITLE);assert.equal(Object.keys(pack.sheets).length,5);
  const assigned=new Set();
  for(const [key,sheet] of Object.entries(pack.sheets)){
    assert.equal(sheet.frames.length,6);
    assert.match(sheet.image,/^data:image\/webp;base64,/);
    const bytes=Buffer.from(sheet.image.split(',')[1],'base64');
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    let area=0;
    for(const [x,y,w,h] of sheet.frames){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=sheet.width&&y+h<=sheet.height);area+=w*h;}
    assert.equal(area,sheet.width*sheet.height);
    for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
      const [x,y,w,h]=sheet.frames[i], [a,b,c,d]=sheet.frames[j];
      assert.ok(x+w<=a||a+c<=x||y+h<=b||b+d<=y,'Preview cells must not overlap: '+key);
    }
  }
  for(const template of STYLE_TEMPLATES){
    const ref=template.coverPreviewSheet,key=ref.key+':'+ref.cell;
    assert.ok(!assigned.has(key));assigned.add(key);
    const sheet=pack.sheets[ref.key],svg=stylePreview(ref);
    assert.ok(svg.includes('viewBox="'+sheet.frames[ref.cell].join(' ')+'"'));
    const [x,y,w,h]=sheet.frames[ref.cell];
    assert.ok(svg.includes('width="'+w+'" height="'+h+'" viewBox='));
    assert.ok(svg.includes('clip-path="url(#sample-frame)"'));
    assert.ok(svg.includes('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>'));
    assert.ok(svg.includes(sheet.image));assert.ok(!/<script|href="(?:https?:|file:)/.test(svg));
  }
  assert.equal(assigned.size,30);
  assert.equal(stylePreview({key:'unknown',cell:0}),'');
  assert.equal(stylePreview({key:'editorial',cell:6}),'');
  assert.equal(stylePreview({key:'__proto__',cell:0}),'');
  assert.equal(stylePreview(null),'');
});

test('additive styles preserve every earlier built-in and custom choices under both language settings',()=>{
  const templates=hooks.promptTemplates({promptTemplates:[]}),legacy=templates.filter(item=>!item.id.startsWith('style-'));
  assert.equal(legacy.length,38);assert.equal(templates[0].id,'blank');
  for(const id of ['dan-koe','neon-card','editorial-list','editorial-swiss','cover-photo-split','cover-portrait-cutout','cover-ink-double'])assert.ok(legacy.some(item=>item.id===id));
  const saved={promptTemplates:[{id:'style-magazine',name:'我的杂志',description:'保留说明',planningPrompt:'Saved plan',imagePrompt:'Saved image'},{id:'my-style',name:'我的模板',planningPrompt:'Private plan',imagePrompt:'Private image'}],hiddenPromptTemplates:['style-fresh']};
  const before=JSON.stringify(saved);
  for(const language of ['zh','en']){
    i18n.configureLocale(()=>language);
    const selected=hooks.promptTemplates(saved).find(item=>item.id==='style-magazine');
    assert.equal(hooks.templateLabel(selected,saved),'我的杂志');assert.equal(selected.imagePrompt,'Saved image');
    const choices=hooks.templateChoices(saved,'cover');assert.equal(choices[0].id,'blank');assert.ok(!choices.some(item=>item.id==='style-fresh'));
    assert.ok(choices.some(item=>item.id==='my-style'));assert.ok(choices.some(item=>item.id==='dan-koe'));
  }
  assert.equal(JSON.stringify(saved),before);i18n.configureLocale(()=> 'zh');
});

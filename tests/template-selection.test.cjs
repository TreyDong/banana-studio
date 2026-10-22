const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),selection=require('../src/templates/selection'),i18n=require('../src/i18n');
const host={Plugin:class{},ItemView:class{constructor(leaf){this.app=leaf.app;}},Modal:class{},PluginSettingTab:class{},FuzzySuggestModal:class{},Notice:class{},normalizePath:s=>s,setIcon(){}};
const filename=path.join(root,'src/main.js'),local=createRequire(filename),mod={exports:{}};
vm.runInNewContext(fs.readFileSync(filename,'utf8')+'\nmodule.exports.hooks={BDView,promptTemplates,figureRecipe};',{module:mod,exports:mod.exports,require:id=>id==='obsidian'?host:local(id),console,process,Buffer,URL,Blob,AbortController,setTimeout,clearTimeout,document:{getElementById:()=>null}},{filename});
const {BDView,promptTemplates}=mod.exports.hooks;
const content='# 生活，值得重新想象\n\n在繁忙的日常里，给阅读和散步留一点空间。\n\n工具可以减少重复劳动，但生活的节奏需要自己选择。';
function fixture(){
  const file={path:'Fixture.md',basename:'Fixture',extension:'md'};
  const app={vault:{getAbstractFileByPath:p=>p===file.path||p.startsWith('assets/')?{...file,path:p}:null,cachedRead:async()=>content,process:async(f,fn)=>fn(content)},metadataCache:{getFileCache:()=>({})}};
  const plugin={settings:{sessions:{},promptTemplates:[],hiddenPromptTemplates:[]},layout:require('../src/rendering/cover-layout'),figureAgent:require('../src/illustrations/figure-agent'),wechatThemes:require('../src/templates/wechat-themes'),activeConnection:()=>({id:'fixture-model',model:'fixture'}),saveSettings:async()=>{}};
  const view=new BDView({app},plugin);view.articlePath=file.path;view.title='生活，值得重新想象';view.render=()=>{};view.renderBody=()=>{};view.remember=()=>{};
  const calls=[];plugin.text=async(connection,system,request,signal)=>{
    calls.push({connection,system,request,signal});
    if(system===selection.SELECTION_SYSTEM){const input=JSON.parse(request);return JSON.stringify({choices:Array.from({length:input.choice_count},(_,i)=>({templateId:i%2?'style-watercolor':'style-fresh',reason:i%2?'透明水彩适合文章的轻盈生活叙事':'自然光与留白呼应文章放慢生活节奏的主题'}))});}
    if(system===plugin.figureAgent.PLAN_SYSTEM){const block=plugin.figureAgent.articleBlocks(content)[0];return JSON.stringify({summary:'用一个安静场景呈现阅读与生活的关系',style:'Airy natural-light photography',images:[{blockId:block.id,side:'after',title:'留出阅读空间',purpose:'呈现文章讨论的生活选择',kind:'illustration',format:'landscape',scene:'One observed reading moment by a window'}]});}
    return JSON.stringify({idea:'为日常留出空间',scene:'One airy room with a quiet window and meaningful daily detail'});
  };
  let generated=0;view.generate=async()=>{generated++;view.covers.push({vaultPath:'assets/'+generated+'.png',templateId:view.template().id});};
  return {view,plugin,calls,generated:()=>generated,file};
}

test('existing sessions stay manual; only new or explicitly automatic sessions opt in',()=>{
  assert.equal(selection.selectionMode({},'cover'),'auto');
  assert.equal(selection.selectionMode({state:{templateId:'dan-koe'}},'cover'),'manual');
  assert.equal(selection.selectionMode({figureTemplateId:'blank'},'figure'),'manual');
  assert.equal(selection.selectionMode({state:{templateMode:'auto'}},'cover'),'auto');
  assert.equal(selection.selectionMode({figureTemplateMode:'auto'},'figure'),'auto');
});
test('selection only accepts the exact visible IDs and requested choice count',()=>{
  const templates=promptTemplates({promptTemplates:[]});
  for(const raw of ['not json','null','{"choices":[]}','{"choices":[{"templateId":"invented","reason":"x"}]}','{"choices":[{"templateId":"style-fresh","reason":""}]}'])assert.throws(()=>selection.parseSelection(raw,templates));
  const result=selection.parseSelection('{"choices":[{"templateId":"style-fresh","reason":"A calm article needs air"}]}',templates);
  assert.equal(result[0].template.id,'style-fresh');assert.equal(result[0].reason,'A calm article needs air');
  assert.throws(()=>selection.parseSelection('{"choices":[{"templateId":"style-fresh","reason":"x"}]}',templates,2));
});
test('new cover batch calls the planning model to choose styles and applies each before generation',async()=>{
  const {view,calls,generated}=fixture();view.coverCount=2;view.state.textLevel='none';view.state.platform='custom';view.state.customW=1600;view.state.customH=640;
  await view.submitCoverChat();
  assert.equal(view.error,'');assert.equal(generated(),2);assert.deepEqual(Array.from(view.covers,c=>c.templateId),['style-fresh','style-watercolor']);
  assert.equal(calls.filter(c=>c.system===selection.SELECTION_SYSTEM).length,1);
  const request=JSON.parse(calls[0].request);assert.equal(request.choice_count,2);assert.equal(request.output_size.w,1600);assert.ok(request.article_data.includes('阅读和散步'));
  assert.equal(view.state.textLevel,'none');assert.equal(view.state.customH,640);assert.equal(view.state.templateMode,'auto');
  assert.ok(view.coverChat.at(-1).text.includes('自然光'));assert.ok(view.covers[1].templateReason.includes('水彩'));
});
test('manual selection including Blank and Dan Koe never invokes the selector',async()=>{
  for(const id of ['blank','dan-koe','style-magazine']){
    const {view,calls,generated}=fixture();view.selectTemplate(id);await view.submitCoverChat();
    assert.equal(view.error,'');assert.equal(generated(),1);assert.equal(view.covers[0].templateId,id);
    assert.ok(!calls.some(c=>c.system===selection.SELECTION_SYSTEM));assert.equal(view.state.templateMode,'manual');
  }
});
test('editing an automatic cover reuses its recorded style without selecting a new one',async()=>{
  const {view,calls}=fixture();view.cover={vaultPath:'assets/old.png',templateId:'style-pixel',templateReason:'原有像素风'};view.covers=[view.cover];view.coverChatDraft='把文字放大一点';
  await view.submitCoverChat();assert.equal(view.error,'');assert.equal(view.covers.at(-1).templateId,'style-pixel');assert.equal(calls.length,0);
});
test('hidden or invalid selections fail before any cover is generated',async()=>{
  const {view,plugin,calls,generated}=fixture();plugin.settings.hiddenPromptTemplates=['style-fresh'];
  await view.submitCoverChat();assert.equal(generated(),0);assert.ok(view.error);assert.equal(calls.length,1);
  assert.ok(view.coverBatch.every(slot=>slot.status==='error'));
  assert.ok(!JSON.parse(calls[0].request).template_data.some(t=>t.id==='style-fresh'));
});
test('cancelling template selection never starts image generation or changes the selected style',async()=>{
  const {view,plugin,generated}=fixture();plugin.text=async()=>{view.operation.controller.abort();return '{"choices":[{"templateId":"style-fresh","reason":"x"}]}';};
  await view.submitCoverChat();assert.equal(generated(),0);assert.equal(view.state.templateId,'blank');assert.equal(view.operation,null);assert.ok(view.coverBatch.every(c=>c.status==='stopped'));
});
test('body planning selects one template and records it on every image in the batch',async()=>{
  const {view,calls}=fixture();view.tab='figure';await view.planFigures();
  assert.equal(view.error,'');assert.equal(view.figurePlan.template.id,'style-fresh');assert.equal(view.figureTemplateMode,'auto');
  assert.ok(view.figurePlan.templateReason);assert.equal(view.agentFigureItems().length,1);
  assert.ok(view.agentFigureItems().every(f=>f.templateId==='style-fresh'));
  const request=JSON.parse(calls[0].request);assert.equal(request.choice_count,1);assert.equal(request.task,'article-body illustration batch');
  assert.ok(!request.template_data.some(t=>t.typography));assert.ok(!calls[1].request.includes('style-watercolor'));
});
test('manual body style is fixed and switching an existing draft to auto requires replanning',async()=>{
  const {view,calls}=fixture();view.tab='figure';view.selectTemplate('dan-koe','figure');await view.planFigures();
  assert.equal(view.error,'');assert.equal(view.figurePlan.template.id,'dan-koe');assert.ok(!calls.some(c=>c.system===selection.SELECTION_SYSTEM));
  view.setTemplateAuto('figure');assert.equal(view.figurePlan.templateSelectionPending,true);
  await view.generateAgentFigures();assert.ok(view.error);assert.equal(view.operation,null);
  await view.planFigures();assert.equal(view.error,'');assert.equal(view.figurePlan.template.id,'style-fresh');assert.ok(!view.figurePlan.templateSelectionPending);
});
test('session restoration and saving preserve independent automatic/manual choices and reasons',()=>{
  const {view,plugin,file}=fixture();
  view.useArticle(file,false);assert.equal(view.templateMode(),'auto');assert.equal(view.templateMode('figure'),'auto');
  view.applyAutomaticTemplate({template:view.automaticTemplateCandidates('cover').find(t=>t.id==='style-fresh'),reason:'通透的生活观察'});
  view.selectTemplate('dan-koe','figure');BDView.prototype.remember.call(view);clearTimeout(view.saveTimer);
  view.useArticle(file,false);assert.equal(view.templateMode(),'auto');assert.equal(view.templateMode('figure'),'manual');assert.equal(view.state.templateId,'style-fresh');assert.equal(view.coverTemplateReason,'通透的生活观察');
  plugin.settings.sessions[file.path]={state:{templateId:'dan-koe'},figureTemplateId:'blank'};
  view.useArticle(file,false);assert.equal(view.templateMode(),'manual');assert.equal(view.state.templateId,'dan-koe');assert.equal(view.templateMode('figure'),'manual');
});
test('automatic selection sees saved prompt edits even when a built-in profile is inherited',()=>{
  const custom={id:'style-magazine',name:'Customized',planningPrompt:'Unique saved planning override',imagePrompt:'Unique saved visual override'};
  const templates=promptTemplates({promptTemplates:[custom]});
  const item=selection.templateCatalog(templates,'cover').find(t=>t.id===custom.id);
  assert.ok(item.planning.includes(custom.planningPrompt));assert.ok(item.visual.includes(custom.imagePrompt));
});
test('retrying a historical manual image uses its recorded recipe, not the latest automatic choice',async()=>{
  const {view}=fixture();view.tab='figure';view.figureMode='manual';view.figureTemplateId='style-watercolor';
  const recipe=mod.exports.hooks.figureRecipe(promptTemplates({promptTemplates:[]}).find(t=>t.id==='style-fresh'));
  const fg={mode:'manual',figureTemplate:recipe,w:1200,h:800,section:'A meaningful scene'};
  let received;view.runFigure=async(image,snapshot)=>{received=snapshot.figureTemplate;};
  await view.retryFigure(fg);assert.equal(received.id,'style-fresh');assert.equal(view.figureTemplateId,'style-watercolor');
});
test('restoring historical body plans restores the saved mode and reason with a manual legacy fallback',async()=>{
  const {view,plugin}=fixture();view.tab='figure';await view.planFigures();
  const historical=view.figurePlan,items=view.agentFigureItems();view.archiveFigurePlan(historical);
  historical.templateMode='manual';historical.templateReason='';historical.template=mod.exports.hooks.figureRecipe(promptTemplates(plugin.settings).find(t=>t.id==='dan-koe'));
  view.figurePlans=[historical];view.figurePlan=null;view.figureTemplateMode='auto';view.figureTemplateReason='newer reason';
  // No existing generated files: restoration produces a draft without altering source text.
  view.figureHistory=()=>[{id:historical.id,plan:historical,items}];
  await view.restoreFigureBatch(historical.id);
  assert.equal(view.error,'');assert.equal(view.figureTemplateId,'dan-koe');assert.equal(view.figureTemplateMode,'manual');assert.equal(view.figureTemplateReason,'');
});

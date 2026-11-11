'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const workspace=require('../src/workspace');
const filename=path.resolve(__dirname,'../src/main.js'),local=createRequire(filename),mod={exports:{}};
const host={Plugin:class{},ItemView:class{},PluginSettingTab:class{},Modal:class{},FuzzySuggestModal:class{},Notice:class{}};
vm.runInNewContext(fs.readFileSync(filename,'utf8')+'\nmodule.exports.hooks={BDView,ArticlePicker,fileToDataUrl};',{module:mod,exports:mod.exports,require:id=>id==='obsidian'?host:local(id),console,process,Buffer,URL,Blob,AbortController,setTimeout,clearTimeout},{filename});
const Plugin=mod.exports,{BDView,ArticlePicker}=Plugin.hooks;
const file=path=>({path,extension:'md',basename:path.split('/').pop().replace(/\.md$/,'')});
function fixture(){
 const draft=file('笔记/Article.md'),ordinary=file('笔记/Ordinary.md'),material=file('资料/网页/Reference.md'),oldDiary=file('03_日记/private.md'),diary=file('笔记/日记/private.md');
 const files=[draft,ordinary,material,oldDiary,diary],byPath=new Map(files.map(f=>[f.path,f]));
 const app={metadataCache:{getFileCache:f=>({frontmatter:f===draft?{media_stage:'写作'}:{}})},vault:{getMarkdownFiles:()=>files,getAbstractFileByPath:p=>byPath.get(p)},workspace:{getActiveFile:()=>oldDiary,getLeavesOfType:()=>[]}};
 const plugin=Object.assign(Object.create(Plugin.prototype),{app,workspace:workspace.DEFAULTS,settings:{lastArticle:oldDiary.path,sessions:{[oldDiary.path]:{brief:'private synthetic fixture',covers:[{vaultPath:'private.png'}]},[material.path]:{brief:'public fixture'}}}});
 const view=Object.assign(Object.create(BDView.prototype),{app,plugin,articlePath:'',render(){}});
 return {app,plugin,view,draft,ordinary,material,oldDiary,diary};
}
test('propertyless notes are selectable by directory; materials need current selection; privacy always wins',()=>{
 const {plugin,draft,ordinary,material,oldDiary,diary}=fixture();
 assert.equal(plugin.articleAllowed(draft),true);assert.equal(plugin.articleAllowed(ordinary),true);assert.equal(plugin.articleAllowed(ordinary,true),true);
 assert.equal(plugin.articleAllowed(material),false);assert.equal(plugin.articleAllowed(material,true),true);
 assert.equal(plugin.articleAllowed(file('04_剪藏/Reference.md'),true),true);
 for(const f of [oldDiary,diary,file('资料/公司/private.md'),file('60_工作库/private.md'),file('20_投资库/private.md')])for(const explicit of [true,false])assert.equal(plugin.articleAllowed(f,explicit),false);
 const paths=workspace.workspacePaths({notesDir:'随笔',diaryDir:'私人',materialsDir:'参考',attachmentsDir:'图片'});
 assert.equal(workspace.articleAllowed(file('私人/x.md'),{media_stage:'写作'},paths,true),false);
 assert.equal(workspace.articleAllowed(file('随笔/x.md'),{media_stage:'写作'},paths),true);
});
test('existing private session cannot restore, appear in picker/history, or become an AI source',async()=>{
 const {app,plugin,view,oldDiary,diary,material}=fixture(),before=JSON.stringify(plugin.settings);
 let selected='unset';view.useArticle=f=>{selected=f;};await BDView.prototype.onOpen.call(view);assert.equal(selected,null);
 const picker={app,allowed:f=>plugin.articleAllowed(f,true)};
 assert.deepEqual(Array.from(ArticlePicker.prototype.getItems.call(picker),f=>f.path),['笔记/Article.md','笔记/Ordinary.md',material.path]);
 assert.equal(BDView.prototype.useArticle.call(view,oldDiary,false,true),false);
 assert.equal(BDView.prototype.refreshForFile.call(view,diary),false);
 view.articlePath=oldDiary.path;view.articleExplicit=true;
 assert.equal(view.activeFile(),null);assert.equal(view.savedGenerations().length,0);
 assert.equal(JSON.stringify(plugin.settings),before);
});
test('explicit materials are accepted for this view but not silently restored from lastArticle',async()=>{
 const {view,plugin,material,app}=fixture();let picked;
 view.useArticle=(...args)=>{picked=args;};assert.equal(view.refreshForFile(material),true);assert.equal(picked[0],material);assert.equal(picked[2],true);
 view.articlePath=material.path;view.articleExplicit=true;assert.equal(view.activeFile(),material);
 view.articleExplicit=false;assert.equal(view.activeFile(),null);
 plugin.settings.lastArticle=material.path;plugin.lastMarkdownPath=material.path;app.workspace.getActiveFile=()=>null;
 await BDView.prototype.onOpen.call(view);assert.equal(picked[0],null);
});
test('private image references cannot escape through a note link or stale saved reference',async()=>{
 const {view,app,plugin}=fixture();
 app.metadataCache.getFirstLinkpathDest=()=>({path:'笔记/日记/private.png',extension:'png'});
 assert.equal(view.resolveVaultImage('alias.png',file('笔记/Article.md')),null);
 let reads=0;app.vault.readBinary=async()=>{reads++;throw new Error('Must not read');};
 await assert.rejects(Plugin.hooks.fileToDataUrl(app,{path:'03_日记/private.png',extension:'png'},plugin.workspace),/隐私目录/);
 assert.equal(reads,0);
});
test('new output paths use shared attachments and leave explicit custom settings unchanged',()=>{
 assert.equal(workspace.outputFolder('05_附件/Banana Studio'),'附件/Banana Studio');
 assert.equal(workspace.outputFolder('Banana Studio'),'附件/Banana Studio');
 assert.equal(workspace.outputFolder('Custom/Images'),'Custom/Images');
 assert.equal(workspace.outputFolder(undefined,workspace.workspacePaths({attachmentsDir:'图片'})),'图片/Banana Studio');
 assert.equal(workspace.workspacePaths({notesDir:'../unsafe'}).notesDir,'笔记');
});

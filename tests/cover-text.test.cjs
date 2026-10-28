const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const coverText = require('../src/planning/cover-text.js');

const host = {arrayBufferToBase64:buffer=>Buffer.from(buffer).toString('base64'),getLanguage:()=>'zh-CN',Plugin:class{},ItemView:class{},PluginSettingTab:class{},Modal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},FuzzySuggestModal:class{constructor(){this.scope={win:null};}open(){this.scope.win={};}},TFile:class{},MarkdownView:class{},Menu:class{addItem(){return this;}addSeparator(){return this;}setUseNativeMenu(){return this;}showAtPosition(){}},Notice:class{},normalizePath:s=>s.replace(/\\/g,'/'),setIcon(){}};
function load(filename) {
  const mod={exports:{}}; const local=createRequire(filename);
  const safeRequire = id => {
    if(id==='obsidian') return host;
    if(/\.(png|svg|webp)$/.test(id)) return 'data:image/png;base64,';
    if(id==='child_process') return {...require(id),spawn(){throw new Error('Unexpected child process during plugin load');},execFileSync(){throw new Error('Unexpected CLI discovery during plugin load');}};
    return local(id);
  };
  let source=fs.readFileSync(filename,'utf8');
  source+='\nmodule.exports.testHooks = {renderTemplatePrompt,parseTemplatePlan,buildCoverPrompt,TEMPLATE_PLAN_SYSTEM};';
  vm.runInNewContext(source,{module:mod,exports:mod.exports,require:safeRequire,Buffer,URL,Blob,process,console,setTimeout,clearTimeout,AbortController,requestAnimationFrame(){},document:{getElementById:()=>null}},{filename});
  return mod.exports;
}
const hooks=load(path.join(root,'src/main.js')).testHooks;

test('normalizeCoverText keeps authored copy and falls back to the article title',()=>{
  const planned=coverText.normalizeCoverText({headline:'把流程画进一页纸',sub:'别让工具吞掉思考'},'原始文章标题',{textLevel:'title-sub'});
  assert.equal(planned.source,'ai');
  assert.equal(planned.headline,'把流程画进一页纸');
  assert.equal(planned.sub,'别让工具吞掉思考');
  const fallback=coverText.normalizeCoverText({sub:'只有副文案'},'原始文章标题',{textLevel:'title'});
  assert.equal(fallback.source,'title');
  assert.equal(fallback.headline,'原始文章标题');
  assert.equal(fallback.sub,'');
  const none=coverText.normalizeCoverText({headline:'不应出现'},'原始文章标题',{textLevel:'none'});
  assert.equal(none.headline,'');
  assert.equal(none.source,'none');
});

test('normalizeCoverText strips decoration and caps length',()=>{
  const cleaned=coverText.normalizeCoverText({headline:'  「你好，  设计」 '},'标题',{textLevel:'title'});
  assert.equal(cleaned.headline,'你好， 设计');
  const long=coverText.normalizeCoverText({headline:'长'.repeat(60)},'标题',{textLevel:'title'});
  assert.equal(long.headline.length,40);
});

test('coverTextRequirement distinguishes text levels',()=>{
  assert.match(coverText.coverTextRequirement({textLevel:'title'}),/主文案/);
  assert.match(coverText.coverTextRequirement({textLevel:'title'}),/不要照搬文章原标题/);
  assert.match(coverText.coverTextRequirement({textLevel:'title-sub'}),/副文案/);
  assert.match(coverText.coverTextRequirement({textLevel:'none'}),/不渲染任何文字/);
});

test('parseDirectionBrief accepts JSON and degrades to plain text',()=>{
  const json=coverText.parseDirectionBrief('```json\n{"direction":"一座桥连接两座图书馆","cover_text":{"headline":"桥与书","sub":""}}\n```');
  assert.equal(json.direction,'一座桥连接两座图书馆');
  assert.equal(json.coverText.headline,'桥与书');
  const plain=coverText.parseDirectionBrief('一段没有 JSON 的普通描述');
  assert.equal(plain.direction,'一段没有 JSON 的普通描述');
  assert.equal(plain.coverText,null);
});

test('displayTitle prefers authored canvas copy',()=>{
  assert.equal(coverText.displayTitle({headline:'图面文案'},'文章标题'),'图面文案');
  assert.equal(coverText.displayTitle(null,'文章标题'),'文章标题');
});

test('regionEditPrompt carries normalized coordinates and preservation rules',()=>{
  const prompt=coverText.regionEditPrompt({x:.25,y:.1,w:.5,h:.4},'把标题换成「新文案」',1200,800);
  assert.match(prompt,/from the left 25%/);
  assert.match(prompt,/from the top 10%/);
  assert.match(prompt,/width 50%/);
  assert.match(prompt,/height 40%/);
  assert.match(prompt,/把标题换成「新文案」/);
  assert.match(prompt,/ONLY inside the marked region/);
  assert.match(prompt,/Do not reproduce the orange overlay/);
  assert.match(prompt,/1200 x 800 px/);
});

test('template prompt renders planned canvas text instead of the article title',()=>{
  assert.equal(typeof hooks.renderTemplatePrompt,'function');
  const blank={id:'blank',imagePrompt:'Creative brief: {concept}\nCanvas: {width} x {height} px\n{text_rule}',titleTreatment:'adaptive'};
  const prompt=hooks.renderTemplatePrompt(blank,{platform:'gzh',textLevel:'title'},'图面文案','A bridge connecting libraries');
  assert.match(prompt,/「图面文案」/);
  assert.doesNotMatch(prompt,/exact complete title/);
});

test('template prompt appends the supporting line only for title-sub',()=>{
  const blank={id:'blank',imagePrompt:'{text_rule}',titleTreatment:'adaptive'};
  const withSub=hooks.renderTemplatePrompt(blank,{platform:'gzh',textLevel:'title-sub'},'主文案','scene','补充说明');
  assert.match(withSub,/「补充说明」/);
  assert.match(withSub,/visually subordinate/);
  const titleOnly=hooks.renderTemplatePrompt(blank,{platform:'gzh',textLevel:'title'},'主文案','scene','补充说明');
  assert.doesNotMatch(titleOnly,/「补充说明」/);
});

test('parseTemplatePlan returns canvas copy with fallback',()=>{
  const good=hooks.parseTemplatePlan('{"idea":"观点","scene":"A scene","cover_text":{"headline":"图面文案","sub":"副"}}',{textLevel:'title-sub'},'文章标题');
  assert.equal(good.coverText.headline,'图面文案');
  assert.equal(good.coverText.sub,'副');
  const missing=hooks.parseTemplatePlan('{"idea":"观点","scene":"A scene"}',{textLevel:'title'},'文章标题');
  assert.equal(missing.coverText.headline,'文章标题');
  assert.equal(missing.coverText.source,'title');
});

test('free-design prompt renders planned canvas text and keeps the title as context only',()=>{
  const prompt=hooks.buildCoverPrompt({platform:'gzh',type:'hero',palette:'warm',rendering:'flat-vector',mood:'balanced',textLevel:'title'},'图面主文案','摘要内容',[],'','文章原标题');
  assert.match(prompt,/图面主文案「图面主文案」/);
  assert.match(prompt,/文章原标题（仅供理解文章，不要渲染到画面）：文章原标题/);
});

test('the planner system prompt demands authored canvas text',()=>{
  assert.match(hooks.TEMPLATE_PLAN_SYSTEM,/cover_text/);
  assert.match(hooks.TEMPLATE_PLAN_SYSTEM,/不照搬文章原标题/);
});

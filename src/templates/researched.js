'use strict';
const { createEditorialTemplate } = require('./editorial');

// Original, offline composition examples. External references inform methods only.
// Snapshot, licenses, inspected cases and selection reasons: assets/template-research.json.
const font = '"PingFang SC","Microsoft YaHei",sans-serif';
const text = (x,y,size,value,color='#172027',weight=800) => `<text x="${x}" y="${y}" font-family='${font}' font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
const rect = (x,y,w,h,fill,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const rule = (x,y,w,color='#172027',width=1) => `<path d="M${x} ${y}h${w}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const circle = (x,y,r,fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const svg = (bg,art,defs='') => `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="384" viewBox="0 0 900 384"><defs>${defs}</defs>${rect(0,0,900,384,bg)}${art}</svg>`;
const person = (x,y,scale,color='#253c43') => `<g transform="translate(${x} ${y}) scale(${scale})">${circle(0,-75,22,color)}<path d="M-32 30q-5-68 3-77t30-10q30 1 33 57l12 58H-43z" fill="${color}"/><path d="M-17 37l-12 59M17 37l23 59" stroke="${color}" stroke-width="15" stroke-linecap="round"/></g>`;
const landscape = (x,y,w,h,sky='#b9c7bf',hill='#5a7463',foreground='#213d37') => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">${rect(0,0,300,200,sky)}${circle(234,45,25,'#f5dfad')}<path d="M0 150L75 47l82 111 57-71 86 76v37H0z" fill="${hill}"/><path d="M0 173l112-38 70 37 118-34v62H0z" fill="${foreground}"/><path d="M160 200q-38-23-4-41t-5-22" fill="none" stroke="#cbbc94" stroke-width="9"/></svg>`;
const FREESTYLE = 'https://github.com/freestylefly/awesome-gpt-image-2/blob/63e6176fa01be51c000108dacd72716d3e46784b/agents/skills/gpt-image-2-style-library/references/style-library.md';
const ZERO = 'https://github.com/ZeroLu/awesome-nanobanana-pro/blob/2ae6e1b8aaed2780fa39915ba868cfeef11cabc1/README.md';
const YOUMIND = 'https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/blob/c12fddf2c8a8416191a6a9c067a0d3f41d2ba3b6/README.md';
const DIRECTIONS = [
  {
    id:'cover-photo-split',name:'照片分栏 · 专题报道',description:'文字与主图分区，适合人物报道、商业观察和生活专题',
    sourceUrl:'https://www.canva.com/blog-graphics/templates/',sourceLabel:'Canva · 版式参考',researchSourceIds:['canva-blog','fotor-banner'],sampleTitle:'普通人的一天',
    preview:svg('#f4f0e6',`${rect(0,0,15,384,'#b25336')}${text(51,66,14,'特别报道','#b25336',650)}${text(49,155,67,'普通人的')}${text(49,235,67,'一天')}${rule(53,296,315,'#a9aaa0')}${text(53,334,15,'在日常里，看见值得记录的事','#696e66',500)}${rect(464,0,436,384,'#8c9f99')}${rect(499,33,327,288,'#bcc8bd')}${rect(518,55,289,249,'#637c78')}${rect(536,75,253,207,'#cdd3ba')}${rect(553,99,54,155,'#8f9b86')}${rect(633,99,142,155,'#9ab0a8')}${person(698,265,.72,'#2c4141')}${rect(480,324,420,60,'#d9d6c5')}`),
    planning:'先确定文章的一个主角、真实场景或具体物件，再把画幅分成明确的标题区和影像区。横版通常标题占四到五成，影像占其余部分；窄版改为上下，不裁掉主体。分栏边界用色块或自然画框表达，标题与照片具有同一条对齐轴。影像必须来自文章的场景，不把模板固定成上班族或窗边人物。',
    art:'A photo-led editorial feature cover with a deliberate split between a quiet typographic field and one immersive photographic scene. A strong complete modern Chinese sans-serif headline, sparse restrained supporting structure, warm neutral stock and a small rust accent. The image has an observed subject, plausible light, tactile environmental detail and a clear focal point. Use one shared alignment axis and thoughtful asymmetrical proportions. On narrow canvases stack the zones rather than cropping the subject. No generic lifestyle stock pose, business dashboard, publisher masthead or invented caption.'
  },
  {
    id:'cover-portrait-cutout',name:'人物切片 · 对谈封面',description:'主体越过色块边界，适合访谈、创作者故事与人物观点',
    sourceUrl:ZERO+'#116-magazine-cover-portrait',sourceLabel:'Nano Banana Pro · 案例参考',researchSourceIds:['zerolu','canva-blog'],sampleTitle:'找到自己的声音',
    preview:svg('#e6d7c0',`${rect(0,0,410,384,'#294e43')}${circle(603,183,150,'#c6ac87')}${person(583,248,1.6,'#273c37')}${rect(611,199,210,29,'#e6d7c0')}${text(48,60,14,'与创作者对谈','#e2d6be',600)}${text(45,159,65,'找到自己的','#fff8e9')}${text(45,238,80,'声音','#fff8e9')}${rule(48,312,267,'#b9c7ba')}${text(48,342,15,'表达，始于认真倾听','#e2d6be',500)}`),
    planning:'用一个主体与干净色块构成人物专题。正文涉及具体人物且用户提供参考时才保持其身份；没有参考时使用明确的虚构人物或与文章有关的物件，不冒充受访者的真实照片。主体可越过色块边界，但不遮挡完整标题。通过眼神、姿态与裁切形成视觉张力，不能靠夸张惊讶表情制造噱头。',
    art:'A sophisticated cutout portrait editorial cover: one expressive article-specific person or subject overlaps a clean deep-color panel and a warm neutral field. Natural anatomical posture, believable edge detail and a single confident crop; headline in dense legible contemporary Chinese grotesk, aligned on a strict edge with generous breathing room. A calm conversational mood rather than celebrity glamour. Use a fictional subject unless an identity reference is explicitly supplied. No copied face, fake interview attribution, shocked influencer expression, publication logo, decorative sticker border or tiny scattered cover lines.'
  },
  {
    id:'cover-monochrome-frame',name:'黑白影像 · 城市留白',description:'黑白环境与克制标题，适合城市、建筑与独处主题',
    sourceUrl:'https://www.fotor.com/blog-banner/templates/',sourceLabel:'Fotor · 封面参考',researchSourceIds:['fotor-banner','canva-blog'],sampleTitle:'城市很大，也需要自己的角落',
    preview:svg('#111416',`${rect(523,36,331,312,'#b0b3b2')}${rect(550,68,104,280,'#484f51')}${rect(673,119,151,229,'#767f80')}${Array.from({length:6},(_,i)=>rule(566,93+i*36,67,'#bcc3c0',8)).join('')}${Array.from({length:5},(_,i)=>rule(690,142+i*39,111,'#c6cdca',7)).join('')}${text(47,68,13,'CITY / QUIET PLACES','#bfc7c4',600)}${text(44,159,65,'城市很大，','#f3f0e9')}${text(46,237,51,'也需要自己的角落','#f3f0e9')}${rule(49,306,314,'#596263')}${text(49,340,15,'在喧闹中，找到安静','#bfc7c4',500)}`),
    planning:'选择文章里的环境或空间细节，以黑白光影、建筑线条或街道尺度表达情绪。标题放在大块安静区域，与主体隔开；留白是构图的一部分，不机械给照片加黑框。只保留一个视角，不制作假新闻现场或编造地点说明。',
    art:'Restrained monochrome architectural or urban editorial photography, deep charcoal, silver midtones and soft white highlights, strong real-world perspective and one observed environmental detail. A quiet dark or light plane carries a complete substantial Chinese sans-serif headline with exceptionally clear spacing. Wide uninterrupted negative space, tactile photographic grain and intentional hard-edge framing. Adapt the environment to the article rather than repeating a skyline. No stock skyscraper montage, fake documentary evidence, invented place label, noir film credits or decorative quotation marks.'
  },
  {
    id:'cover-contact-sheet',name:'胶片拼版 · 旅行手记',description:'两到三幅关联场景形成节奏，适合旅行、观察与回顾',
    sourceUrl:YOUMIND+'#no-35-infographic--edu-visual---vintage-travel-journal-editorial-collage',sourceLabel:'YouMind · 分类研究',researchSourceIds:['youmind','fotor-banner'],sampleTitle:'带着好奇心，去一座陌生的城市',
    preview:svg('#ede6d9',`${text(43,46,13,'旅行手记','#805e49',650)}${text(40,111,53,'带着好奇心，')}${text(42,174,50,'去一座陌生的城市')}${rect(45,204,248,139,'#252e2b')}${rect(305,204,248,139,'#252e2b')}${rect(565,204,290,139,'#252e2b')}${landscape(52,211,234,125)}${landscape(312,211,234,125,'#b0c4c4','#9a8268','#405e52')}${landscape(572,211,276,125,'#d5ba9a','#a47a57','#594c42')}`),
    planning:'以文章里同一主题的两到三个观察组成一条连贯的视觉序列。照片的尺度、色温和边距统一，保留一幅主景，其他只是补充；不要把多个方案拼成联系表。若正文没有多个地点，就展现同一地点的不同细节，不凭空造地名、行程或坐标。',
    art:'A premium analog travel-journal cover with two or three related photographic moments arranged as one intentional contact-strip composition. A clear dominant scene, consistent color grade, subtle film grain, slim uncoated-paper gutters and spacious editorial Chinese headline. Warm natural daylight, observed everyday detail and measured rhythm. The strip expresses one story rather than alternative designs; omit frame numbers and captions unless explicitly supplied. No invented itinerary, fake location evidence, four-city moodboard, passport stamps, stock postcard labels or multiple separate finished covers.'
  },
  {
    id:'cover-scrapbook',name:'撕纸日记 · 生活拼贴',description:'纸边、照片与少量笔触，适合生活记录和个人成长',
    sourceUrl:'https://github.com/PicoTrex/Awesome-Nano-Banana-images/blob/2558bf0bb825be150c5d1aeab918cd90004882d3/README.md',sourceLabel:'Nano Banana · 视觉研究',researchSourceIds:['picotrex','youmind'],sampleTitle:'把零碎日常，拼成自己的生活',
    preview:svg('#e3ccb5',`<path d="M0 56l53 11 75-10 80 12 54-8 91 9 75-11 67 7 14 318H0z" fill="#f7f0df"/>${text(41,129,52,'把零碎日常，')}${text(43,198,51,'拼成自己的生活')}${text(45,301,15,'记录，不必等待完整','#855b47',550)}${rule(45,266,335,'#a25b48',5)}<g transform="rotate(8 668 187)">${rect(522,45,284,294,'#faf5e9')}${landscape(537,60,254,235,'#d5c2a1','#89987a','#496b5c')}</g><path d="M557 43l28-13 84 28-11 25-87-25z" fill="#bda67d" opacity=".7"/><path d="M778 294q51-48 73-13m-7-18 7 18-21 3" fill="none" stroke="#9a4d38" stroke-width="3"/>`),
    planning:'选择一个文章中的生活片段，用一到两层撕纸、一个主要照片或手绘画面与少量批注线条呈现个人记录感。拼贴服务一个叙事，不是素材墙。标题保持现代黑体与清楚断行；不得复刻示例中的物件、手写句子或照片，不编造作者经历与引用。',
    art:'An intimate editorial scrapbook composition: one meaningful photographic or painted moment, two or three believable torn-paper layers, subtle tape translucency, tactile fibers and a few confident graphite or rust-pencil strokes. Warm everyday colors, coherent shadows and a calm clear title region. The complete Chinese headline is typeset in a strong modern sans-serif, independent of the handcrafted illustration texture. No crowded sticker pack, fake handwriting paragraphs, invented personal memories, brand labels or copied reference photograph.'
  },
  {
    id:'cover-bauhaus',name:'包豪斯 · 形状与秩序',description:'几何形体有节奏地呼应标题，适合设计、创意和方法主题',
    sourceUrl:'https://www.kittl.com/templates/posters/bauhaus',sourceLabel:'Kittl · 海报参考',researchSourceIds:['kittl-posters'],sampleTitle:'让灵感，有地方发生',
    preview:svg('#eee4ce',`${rect(0,0,31,384,'#1d2525')}${text(67,57,13,'DESIGN / THINK / MAKE','#585c50',650)}${text(62,159,76,'让灵感，')}${text(65,246,69,'有地方发生')}${rect(600,46,105,289,'#c43f30')}${circle(742,193,113,'#e8b53a')}${rect(704,193,151,142,'#264e78')}${circle(742,193,53,'#eee4ce')}${rule(68,331,419,'#26312c',2)}`),
    planning:'先把文章的关系提炼为一种形状关系：连接、重复、平衡、开合或错位。选择最多三种基本形体，通过尺度与遮挡表达该关系，而不是摆放无关积木。标题与几何共用网格，文字清楚、留白充分；不强加包豪斯品牌或设计师签名。',
    art:'An original Bauhaus-informed editorial poster: circles, arcs and rectangular masses arranged with deliberate geometric tension, limited brick red, muted primary blue, warm yellow and natural ivory. Flat matte printed surfaces, sharp edges, generous negative space and an optically aligned heavyweight Chinese grotesk headline. Geometry has a clear conceptual relationship drawn from the brief rather than arbitrary decorative blocks. No copied historic poster composition, school logo, faux dates, dense small text, 3D shading or rainbow colors.'
  },
  {
    id:'cover-brutalist',name:'粗野排版 · 街头观点',description:'巨大文字和粗粝印刷感，适合鲜明立场与行动宣言',
    sourceUrl:'https://www.kittl.com/templates/posters/brutalist',sourceLabel:'Kittl · 海报参考',researchSourceIds:['kittl-posters','youmind'],sampleTitle:'别等完美，先开始',
    preview:svg('#181a19',`${text(47,53,13,'MAKE SOMETHING REAL','#d7ddc9',650)}${text(38,161,94,'别等完美，','#e3ef70')}${text(41,268,112,'先开始','#f0f0e5')}${rect(630,250,224,66,'#e3ef70')}${text(651,296,38,'现在行动','#181a19')}${rule(48,338,807,'#666e64')}<path d="M657 64l105 45-105 45m69-90 105 45-105 45" fill="none" stroke="#e3ef70" stroke-width="10"/>`),
    planning:'找出标题中有力量的主句，让极大但完整的文字成为主体，通过硬边色块、密集与疏松的对比、少量印刷噪点制造张力。最多一个强调词，不使用无法阅读的倾斜文字与过度拉伸，不添加条码、伪序号或刻意挑衅的口号。',
    art:'A bold contemporary brutalist editorial cover with monumental compact Chinese sans-serif type, hard flat color planes and a raw black-and-acid-lime or article-appropriate two-color print palette. Deliberate scale contrast, strong flush alignment, a little imperfect ink texture in the illustration, and ample outer safe margins. Keep every headline character clean, complete and readable; visual tension comes from composition, never distortion. No fake barcode, random serials, borrowed streetwear identity, tilted illegible headline, excessive stickers, UI chrome or invented provocative slogan.'
  },
  {
    id:'cover-retro-travel',name:'复古旅行 · 风景明信片',description:'分层风景与暖色印刷，适合旅行、地方记录和周末生活',
    sourceUrl:'https://playgroundai.com/templates/s/vintage-poster',sourceLabel:'Playground · 海报参考',researchSourceIds:['playground-vintage','zerolu'],sampleTitle:'沿着山路，找回周末',
    preview:svg('#efddb6',`${rect(24,24,852,336,'#6c9c9b')}${circle(715,93,54,'#ecd294')}<path d="M24 306L247 81l133 172L573 63l303 262v35H24z" fill="#43736d"/><path d="M24 336l241-147 175 134 190-129 246 163v3H24z" fill="#28544f"/><path d="M557 360q-98-64 11-106t2-78" fill="none" stroke="#dfba7d" stroke-width="18"/>${text(65,111,62,'沿着山路，','#fff4d7')}${text(66,185,62,'找回周末','#fff4d7')}${text(67,319,14,'出发，也是一种休息','#f3e3bc',650)}`),
    planning:'从文章提取一个真实地点特征或自然环境，用前中远景的平面色层和弯曲视觉路径形成旅行海报。标题与风景共用一个完整画面，不加伪旅游局标志、价格或不存在的地标。地点不明确时表达普通自然环境，不默认套山峰与日落。',
    art:'A richly art-directed vintage travel-print cover, broad sculpted landscape color planes, a winding visual path, atmospheric distance and warm lithographic ink on textured cream stock. Limited deep teal, ochre and faded coral adapted to the article environment. A confident complete Chinese sans-serif display headline integrated into a calm sky or ground field, with carefully balanced semantic lines. No copied tourism poster, invented landmark, travel price, tourism logo, souvenir collage or tiny decorative caption.'
  },
  {
    id:'cover-cyanotype',name:'蓝晒印相 · 自然观察',description:'植物或物件的光影轮廓，适合自然、科学观察和慢生活',
    sourceUrl:FREESTYLE+'#nature-science-poster--自然科普海报',sourceLabel:'GPT Image · 风格研究',researchSourceIds:['freestylefly','kittl-posters'],sampleTitle:'观察一片叶子，重新认识自然',
    preview:svg('#19468c',`${text(47,62,13,'OBSERVE / SLOW DOWN','#cbdce7',650)}${text(44,157,57,'观察一片叶子，','#f3f0df')}${text(46,234,57,'重新认识自然','#f3f0df')}<g stroke="#d9e7df" stroke-width="2" fill="#d9e7df"><path d="M700 335Q640 180 760 46" fill="none"/>${Array.from({length:7},(_,i)=>`<ellipse cx="${687+i*6}" cy="${290-i*31}" rx="42" ry="13" transform="rotate(${i%2?30:-35} ${687+i*6} ${290-i*31})" opacity="${.55+i*.05}"/>`).join('')}</g>${rule(49,308,413,'#8db4d2')}${text(49,343,15,'从一个细节，开始好奇','#cbdce7',500)}`),
    planning:'用一个与文章相关的植物、自然物或日常物件的轮廓与光印痕迹表达观察，而不是制作百科展板。深蓝背景上的留白与白色轮廓形成层次，标题单独规划、完整可读。不添加未经核实的物种名称、实验结论或数字尺度。',
    art:'A poetic cyanotype-inspired photogram editorial cover: deep Prussian-blue paper, luminous ivory silhouettes of one article-specific natural or everyday subject, delicate translucent overlap and subtle emulsion-edge texture. A quiet generous title field carries strong complete modern Chinese sans-serif lettering with careful line balance. Photographic contact-print sensitivity rather than a technical plate. No fake species label, invented measurement, laboratory claims, scientific diagram clutter, generic leaf repeat pattern or copied specimen print.'
  },
  {
    id:'cover-ink-double',name:'水墨叠影 · 人文意象',description:'主体轮廓与山水空间相融，适合人文、阅读和文化随笔',
    sourceUrl:FREESTYLE+'#ink-double-exposure-poster--水墨双重曝光海报',sourceLabel:'GPT Image · 风格研究',researchSourceIds:['freestylefly'],sampleTitle:'山水之间，看见另一种生活',
    preview:svg('#e9e4d9',`${text(46,60,13,'人文随笔','#8b4a3b',650)}${text(44,147,61,'山水之间，')}${text(46,225,56,'看见另一种生活')}<path d="M576 337q-17-61 14-91 35-39 14-68-27-40 8-85 36-48 95-36 78 19 60 86-8 28 30 51-24 29-53 28l12 115z" fill="#76847b"/><path d="M575 337l53-126 34 70 49-106 55 162z" fill="#3b514b"/><path d="M590 338q72-62 151-39" fill="none" stroke="#d9ddd0" stroke-width="4"/>${rect(47,287,45,45,'#a2503d')}${text(57,318,24,'观','#f8ead7',600)}`),
    planning:'把文章的一个主体轮廓与相关环境融合，说明轮廓边界和内部山水、城市或自然纹理如何表达同一个观点。不能凭空冒用真人肖像，不默认把每篇都变成古风女子。水墨负责层次和气息，中文标题仍用厚实清楚的横排黑体，除非用户另有指定。',
    art:'Original ink-wash double-exposure editorial art: an article-specific human or object silhouette softly contains a coherent secondary environment, with wet ink diffusion, controlled dry-brush edges, layered mist and restrained mineral-gray tones on warm rice paper. One muted cinnabar accent may balance the composition. Typography is art-directed separately: a substantial horizontal contemporary Chinese sans-serif headline, clean strokes, legible contrast and generous margins. No default calligraphy, copied artist work, borrowed portrait, fake seal signature, random temple symbols or overlaid unreadable text.'
  },
  {
    id:'cover-miniature-story',name:'微缩场景 · 故事切片',description:'一个立体空间承载故事，适合书评、场所与创作主题',
    sourceUrl:ZERO+'#219-novel-scene-3d-poster',sourceLabel:'Nano Banana Pro · 案例参考',researchSourceIds:['zerolu'],sampleTitle:'小小书店，装得下一个世界',
    preview:svg('#e9e3d6',`${text(47,61,13,'关于书与空间','#7b5e4c',600)}${text(44,149,62,'小小书店，')}${text(46,230,52,'装得下一个世界')}<path d="M547 281l154-70 141 68-151 74z" fill="#b6a485"/><path d="M558 278V120l140 54v164z" fill="#bd9e77"/><path d="M698 174l132-54v158l-132 60z" fill="#dcc5a0"/>${Array.from({length:4},(_,i)=>`<path d="M573 ${149+i*33}l109 41v10l-109-41z" fill="#705c45"/><path d="M712 ${190+i*30}l104-43v10l-104 43z" fill="#8b7152"/>`).join('')}${person(739,265,.34,'#344f48')}${rule(49,309,360,'#b4a48a')}`),
    planning:'从文章选择一个有叙事意义的空间，用一处精细微缩场景呈现人物和环境关系。透视统一，物件有因果关系；不要固定为书店、咖啡馆或房间剖面。没有原文依据时不得自动检索或补写小说情节、名句和地点。标题位于场景外的安静区域，横竖画幅独立构图。',
    art:'An original finely crafted miniature narrative diorama, one coherent axonometric or cutaway scene with believable small-scale materials, warm directional light, expressive tiny human action and a grounded soft shadow. A restrained neutral atmospheric field, generous negative space and a strong separately typeset complete Chinese headline. Use the scene supplied by the article brief, not a stock bookstore or famous-film recreation. No branded animation-studio imitation, fabricated novel quote, museum label text, toy product packaging, multiple scene options or cluttered exploded diagram.'
  },
  {
    id:'cover-soft-gradient',name:'雾面渐变 · 科技专题',description:'柔和光场与清晰大字，适合 AI、数字产品和未来讨论',
    sourceUrl:'https://www.adobe.com/express/templates/banner',sourceLabel:'Adobe Express · 版式参考',researchSourceIds:['adobe-banner','canva-blog'],sampleTitle:'工具在变，创造力走向哪里',
    preview:svg('#edeafa',`<ellipse cx="650" cy="260" rx="228" ry="152" fill="url(#soft)"/>${text(46,61,13,'TECHNOLOGY / CREATIVE WORK','#4f4b79',650)}${text(43,156,74,'工具在变，','#25233b')}${text(47,242,60,'创造力走向哪里','#25233b')}${rule(49,313,466,'#b6a9d0')}${text(49,345,15,'把问题留给人，把重复交给工具','#656080',500)}<ellipse cx="737" cy="185" rx="74" ry="136" transform="rotate(33 737 185)" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`,`<radialGradient id="soft"><stop stop-color="#bc8fac"/><stop offset=".55" stop-color="#a5b6d5"/><stop offset="1" stop-color="#edeafa"/></radialGradient>`),
    planning:'从文章中选择一个抽象但明确的变化或关系，用柔和光场与一个简洁的空间形态表达。标题是第一视觉焦点，渐变在后方支撑对比，不放无关机器人、光球、芯片或伪产品界面。根据标题语义断行，最多一个强调点，不把每行都放到最大。',
    art:'A contemporary matte-gradient editorial technology cover, soft diffused mineral-violet and muted-blue light fields, one article-specific abstract spatial form and restrained translucent depth. A crisp heavy compact Chinese sans-serif headline dominates a calm high-contrast region with disciplined flush alignment, generous margins and optical kerning. Gradients feel like photographed diffuse light rather than neon web-app chrome. No generic robot, glowing brain, random orbital planets, fake UI screenshot, tiny feature cards, promotional button or unsupported product claim.'
  },
  {
    id:'cover-motion',name:'动势瞬间 · 行动主题',description:'斜向力量和人物动作，适合行动、习惯、运动与挑战',
    sourceUrl:FREESTYLE+'#sports-campaign-poster--运动商业-campaign',sourceLabel:'GPT Image · 风格研究',researchSourceIds:['freestylefly','canva-blog'],sampleTitle:'迈出第一步，比准备更重要',
    preview:svg('#e9e5d7',`<path d="M499 0h227L578 384H351z" fill="#e25f3d"/><path d="M683 0h53L589 384h-53z" fill="#263d3c"/>${person(708,202,1.05,'#203b3b')}<path d="M687 218l-71 48m108-49 65 46" fill="none" stroke="#203b3b" stroke-width="23" stroke-linecap="round"/>${text(44,59,13,'START SMALL / KEEP GOING','#5e6557',650)}${text(42,153,63,'迈出第一步，')}${text(45,233,58,'比准备更重要')}${rule(48,310,372,'#798374',2)}${text(48,343,15,'行动，让想法落地','#5e6557',550)}`),
    planning:'从正文选择一个真实可理解的行动，用身体重心、方向和环境阻力表现。给出可信姿态、单一运动方向与清楚视觉路径，标题沿稳定水平轴保持可读。不能假造运动成效、冠军身份、计时数字和品牌背书；非运动文章可以用与主题相关的工作或生活行动。',
    art:'A high-energy editorial action cover with one physically plausible human gesture, directional framing, strong diagonal force and tactile photographic or cut-paper material. Off-white, charcoal and one controlled warm-orange accent; subtle motion in the environment while the focal subject and complete Chinese headline remain sharp. Keep typography horizontally legible on a stable alignment axis and avoid obscuring the action. The gesture follows the article, not a default athlete. No sports-brand logo, fabricated achievement, stopwatch metric, lightning icon spam, exaggerated anatomy or angled unreadable slogan.'
  },
  {
    id:'cover-exhibition',name:'展览图录 · 艺术阅读',description:'作品、留白与严谨字距，适合艺术、审美和文化评论',
    sourceUrl:'https://www.kittl.com/templates/posters/art-show',sourceLabel:'Kittl · 海报参考',researchSourceIds:['kittl-posters','guizang'],sampleTitle:'换个角度，重新看一件作品',
    preview:svg('#eeeae0',`${text(47,59,13,'关于观看','#8e4939',650)}${text(44,151,64,'换个角度，')}${text(47,231,55,'重新看一件作品')}${rule(49,312,431,'#8f9385')}${text(49,343,15,'把感受，变成自己的判断','#656b60',500)}${rect(579,46,270,292,'#d3cabb')}${rect(600,68,227,248,'#f5eddf')}<path d="M642 270V145q0-52 60-52t60 52v125h-38V148q0-19-23-19t-23 19v122z" fill="#97674f"/>${rect(621,274,183,20,'#b7aa96')}`),
    planning:'用一件与文章观点有关的原创作品、雕塑或物件作为主视觉，留出有张力的观看空间。标题、图像与细线形成严谨对齐，不虚构展览名称、策展人、年代或作品归属。不能直接复制某件未授权艺术品；用户没有指定作品时生成独立视觉隐喻。',
    art:'An art-book or exhibition-catalog editorial cover with one original sculptural or graphic work, thoughtful negative space, museum-quality material observation and measured typographic proportions. Warm stone paper, near-black compact Chinese sans-serif headline, one quiet earthy accent and fine alignment rules. The artwork is a newly imagined article-specific metaphor, not a reproduction of a known painting. Precise margins and confident spacing create sophistication without tiny metadata. No invented exhibition title, curator name, provenance, institutional logo, auction value, copied artwork or decorative sales badge.'
  }
];
const RESEARCHED_TEMPLATES = DIRECTIONS.map(createEditorialTemplate);
module.exports = { RESEARCHED_TEMPLATES };

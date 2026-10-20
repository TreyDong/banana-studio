'use strict';

// Original typographic examples, not generated-image claims or fixed article copy.
const font = '"PingFang SC","Microsoft YaHei",sans-serif';
const text = (x, y, size, value, fill = '#191919', weight = 800) => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}">${value}</text>`;
const line = (x1, y1, x2, y2, stroke = '#191919', width = 1) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
const example = (bg, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="384" viewBox="0 0 900 384"><rect width="900" height="384" fill="${bg}"/><g font-family='${font}'>${content}</g></svg>`;
const DIRECTIONS = [
  {
    id: 'editorial-list', name: '清单榜单 · 数字焦点', description: '适合资源合集、年度精选与推荐清单，突出一个真实数字',
    preview: example('#f4f0e8', `${line(42,49,71,49,'#ce775b',4)}${text(83,55,13,'阅读 · 精选清单','#ce775b',600)}${text(42,125,43,'值得反复读的')}${text(37,272,139,'12','#cf785a',850)}${text(215,269,48,'篇文章')}<rect x="565" y="65" width="287" height="259" rx="12" fill="#fff" stroke="#e7e1d6"/>${text(591,105,16,'READING LIST')}${[['01','认识自己'],['02','理解世界'],['03','开始行动']].map(([n,title],i)=>`${line(591,125+i*59,825,125+i*59,'#e9e4dc')}${text(592,156+i*59,16,n,'#cf785a',700)}${text(628,156+i*59,18,title,'#262320',650)}`).join('')}${text(44,332,15,'找到值得留下的内容','#7a756d',500)}`),
    planning: '适合有真实条目、资源或推荐的文章。只在原文或标题确有数字时将该数字作为视觉焦点，其他情况以标题关键词取代。为主标题与一张克制的清单设计左右或上下层级；最多提取正文中三个真实分类，信息不足则只放完整标题。不要套用示例的12或虚构TOP排名。',
    art: 'A refined warm-ivory editorial resource cover, near-black compact heavy Chinese sans-serif, one muted terracotta emphasis. A single verified numeral or existing headline keyword anchors the composition, balanced against a restrained white paper list with generous padding, fine separators and barely perceptible soft shadow. Optically align different type sizes on a common baseline and retain complete semantic reading order. The headline is dominant; the list is supporting and omitted when not supported by the brief. No dashboard clutter, invented ranks or gratuitous checkmarks.'
  },
  {
    id: 'editorial-swiss', name: '瑞士网格 · 理性秩序', description: '适合商业分析、方法思考与产品观点，严格对齐、少量强调',
    preview: example('#f3f1e9', `${text(44,48,12,'THINKING / PERSPECTIVE','#252525',650)}${line(44,69,856,69)}${text(41,169,64,'把复杂问题')}${text(41,246,64,'想清楚')}<circle cx="725" cy="198" r="76" fill="#df4433"/><circle cx="725" cy="198" r="46" fill="#f3f1e9"/><path d="M649 198h152m-76-76v152" stroke="#171717" stroke-width="2"/>${line(44,313,856,313)}${text(44,343,13,'从问题到判断','#55534e',500)}${text(685,343,13,'一条清晰的思路','#55534e',500)}`),
    planning: '提炼文章中一个核心判断或方法，按严格网格规划一个主标题、一个有解释力的几何关系与充分留白。用对齐、留白和尺度表达清晰的逻辑，几何形态必须对应观点，不假装成真实数据图表。标题默认左对齐、两行均衡，不编造期号或研究结论。',
    art: 'Swiss international typographic editorial design, disciplined modular grid, flush-left heavyweight modern Chinese grotesk, precise shared alignment edges and generous margins. Warm off-white paper, near-black ink and one deliberate vermilion geometric intervention that expresses the supplied idea. Strong asymmetric balance, fine hairline rules, exceptional optical kerning, restrained print texture. Large readable complete headline with only one accent. Avoid presentation-slide boxes, pseudo-data, random numerals, gradients, soft UI cards and scattered decorative icons.'
  },
  {
    id: 'editorial-headline', name: '刊物大字 · 观点宣言', description: '适合个人观点、成长随笔与态度表达，以文字本身形成封面',
    preview: example('#f2cd50', `${text(43,48,12,'IDEAS FOR EVERYDAY LIFE','#292719',650)}${text(36,158,81,'慢一点，')}${text(39,245,70,'也能走得更远')}<circle cx="812" cy="62" r="18" fill="#1d1c18"/>${line(44,306,855,306,'#26251e',2)}${text(44,342,16,'节奏 · 选择 · 长期主义','#292719',600)}`),
    planning: '让文章原本有力量的一句完整标题成为画面主体。按语义断成两至三行，明确主句与前提的大小差别，选一个词强调，其余退让。画面只允许一处极少量的形状或印刷标记作为节奏，不能添加空泛口号、海报期号或另造副标题。颜色随用户要求可调整。',
    art: 'Bold independent-magazine typographic cover, a confident warm ochre or article-appropriate flat spot-color field, deep black dense contemporary Chinese headline. Typography itself forms the image: strong semantic line breaks, compact rhythm, controlled differences of scale and one quiet graphic punctuation. Excellent optical alignment and broad intentional negative space, subtly tactile matte print. Preserve every character, with no artificial stretching. No giant random numbers, gradients, logos, motivational stock photo, stickers, outlined lettering or unsolicited copy.'
  },
  {
    id: 'editorial-newsprint', name: '复古报刊 · 长文评论', description: '适合社会观察、文化评论与深度长文，纸张肌理与报刊层级',
    preview: example('#e8dfca', `${line(42,39,858,39,'#322f29',3)}${text(42,67,15,'观察 · 记录 · 思考','#322f29',600)}${line(42,82,858,82,'#322f29')}${text(41,162,61,'重新理解')}${text(41,234,61,'工作的意义')}<path d="M608 262V159h43v-31h41v71h34v-96h52v159h56v25H592v-25z" fill="#504b40"/><path d="M621 184h17m24-28h17m24 67h17m18-91h27m-27 29h27m-27 29h27m-27 29h27" stroke="#e8dfca" stroke-width="4"/>${line(42,290,858,290,'#322f29')}${[315,327,339].map(y=>`${line(44,y,281,y,'#9e9581')}${line(309,y,546,y,'#9e9581')}${line(575,y,854,y,'#9e9581')}`).join('')}`),
    planning: '为文章选择一个可解释的纪实对象或环境，使用报刊的标题层级、栏线和纸感。完整标题醒目，可配一幅有文章依据的半色调插图。正文没有引语、日期、数据时不得伪造；少放文字，不用无法阅读的假段落填满。不要冒充真实媒体或生成新闻现场证据。',
    art: 'Cultured vintage newsprint editorial cover with warm uncoated paper fibers, dark sepia-black ink, crisp ruled columns and a large carefully kerned Chinese headline. One original high-contrast halftone or etched documentary-style image related to the article, occupying a considered secondary field. Contemporary readable hierarchy with a restrained archival print character, no borrowed publication masthead. Do not fill columns with fake paragraphs, fabricated dates, quotes, newspaper brands, distressed illegible lettering or unsupported documentary claims.'
  },
  {
    id: 'editorial-duotone', name: '双色丝印 · 创意表达', description: '适合创作、灵感与文化议题，强烈双色和手工印刷的张力',
    preview: example('#e9e4d5', `${text(44,48,13,'CREATIVE NOTES','#2349a0',700)}${text(41,153,64,'好想法，','#2248a3')}${text(41,230,64,'从哪里来？','#2248a3')}<path d="M658 293V99q91 0 91 86t-91 108" fill="#eb7155"/><path d="M756 293V71q84 52 70 129t-70 93" fill="#244ca1"/><path d="M658 291q-69-31-57-104 72 10 72 104" fill="#244ca1"/>${line(44,310,856,310,'#244ca1',2)}${text(44,344,15,'观察，是创造的开始','#244ca1',600)}`),
    planning: '将文章观点转化为一个大胆但具体的视觉形态，优先剪影、重叠、镂空或手工刻痕，让两个色版的相交表达关系。只用两种主色与纸底，标题完整可读。不要把所有文章固定成植物或抽象圆形，场景随文章变化。',
    art: 'Original two-color screenprint editorial poster, saturated cobalt and warm coral inks on natural ivory paper, expressive flat silhouettes and carefully designed negative shapes. Slight ink registration offset in illustration only, visible overprint and fine paper tooth, confident handmade shape edges without messy lettering. One article-specific visual metaphor with a prominent dense clean Chinese sans-serif headline, ample margins and disciplined alignment. No rainbow palette, glossy 3D, corporate vector people, stock infographic, fake hand lettering or illegible printing defects in the title.'
  },
  {
    id: 'editorial-archive', name: '档案手稿 · 阅读札记', description: '适合读书笔记、研究札记与经验整理，纸页层次和少量批注',
    preview: example('#ded8c9', `<path d="M552 58h243l51 42v218H552z" fill="#c5b497"/><rect x="575" y="65" width="238" height="244" transform="rotate(5 694 187)" fill="#f5f0e3"/><rect x="565" y="80" width="239" height="243" transform="rotate(-4 684 202)" fill="#fffaf0"/>${text(44,65,13,'READ / REFLECT / KEEP','#6c6559',650)}${text(41,166,62,'读过以后，')}${text(41,241,62,'留下了什么')}<path d="M610 142h150m-150 24h125m-125 24h150m-150 24h107" stroke="#aaa18e" stroke-width="3"/><path d="M607 227q69 14 134-4" fill="none" stroke="#ac563c" stroke-width="6"/><path d="M44 294q179 11 338-3" stroke="#ac563c" stroke-width="5" fill="none"/>${text(44,337,15,'把阅读变成自己的思考','#6c6559',550)}`),
    planning: '从文章提取一个值得记住的发现，用原始纸页、索引卡、折角、下划线或极少量手写线条承载，不把所有内容堆成笔记墙。主标题使用清楚的印刷黑体，手写只作为图像批注，不代替完整标题。不要伪造书中引文、参考文献、手稿作者签名或机密档案标记。',
    art: 'Tactile reading-journal and research-notebook editorial cover, a restrained arrangement of two or three physical index cards or uncoated sheets with natural edges, subtle cast shadows, graphite marks and one muted rust-red annotation stroke. Warm archival paper, quiet material detail, a deliberate open title area with large clean contemporary Chinese sans-serif type. Typography is printed and legible, while minor freehand strokes add thoughtfulness to the illustration. No fabricated book quotes, bibliographic references, signatures, confidential stamps, crowded sticky-note wall, handwriting headline or fake scanned documents.'
  }
];
const SHARED = '从当前文章提炼有依据的观点、主体与关系；用户的画幅、风格和文字开关优先。一次只构思一张；多个候选更换视觉概念，不能拼成多张。示例仅展示排版，示例标题、数字、物件与配色不自动带入。不得编造事实、收益、排名或引语。';
function createEditorialTemplate(direction) { return ({
  id: direction.id, name: direction.name, description: direction.description, coverReady: true,
  ...(direction.sourceUrl ? { sourceUrl: direction.sourceUrl, sourceLabel: direction.sourceLabel } : {}),
  ...(direction.sampleTitle ? { sampleTitle: direction.sampleTitle, researchSourceIds: direction.researchSourceIds } : {}),
  titleTreatment: 'adaptive', coverPreviewSvg: direction.preview, coverPreviewKind: 'typeset-example',
  previewSvg: example('#f3efe5', `<path d="M160 124h160v130H160zM580 124h160v130H580z" stroke="#302e29" stroke-width="3" fill="none"/><path d="M365 190h167m-19-15 19 15-19 15" fill="none" stroke="#ac563c" stroke-width="5"/>${text(42,352,20,'LAYOUT STUDY / 构图示意 · 非生成效果','#777064',500)}`),
  planningPrompt: SHARED + direction.planning + '仅在要求文字时使用用户完整标题；不得虚构副标题。用英文描述当前这一张的主体、构图和视觉处理。',
  imagePrompt: 'Create one finished editorial article cover.\nCreative brief: {concept}\n' + direction.art + '\nCanvas: {width} x {height} px, aspect ratio {ratio}. Adapt the complete composition to this exact canvas with at least 6 percent safe margins.\n{text_rule}\nThe text rule above takes absolute priority: when no text is requested, remove all lettering, numerals, captions and typographic marks and retain an article-specific visual composition. Do not import sample headlines, counts, claims or subjects. No watermarks, contact sheets or multi-cover layouts.',
  figurePlanningPrompt: SHARED + direction.planning + '当前任务是正文段落配图，重用色彩与材质，不复刻封面标题或清单版式。用具体场景或清晰关系帮助理解段落，只保留明确要求且有依据的短标签。',
  figurePrompt: 'Create one article-body illustration.\nCreative brief: {concept}\n' + direction.art + '\nUse the visual palette, material and print technique only; replace cover headline, list and poster hierarchy with a clear article-specific scene or relationship.\nCanvas: {width} x {height} px, aspect ratio {ratio}, with safe margins.\n{text_rule}\nNo cover headline, invented metrics, bibliography, logos or watermark.',
  defaults: { textLevel: 'title' }
}); }
const EDITORIAL_TEMPLATES = DIRECTIONS.map(createEditorialTemplate);
module.exports = { EDITORIAL_TEMPLATES, createEditorialTemplate };

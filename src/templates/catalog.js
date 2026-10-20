// Article-led recipes informed by the cited public template categories.
// See THIRD_PARTY_NOTICES.md for sources and attribution. Body previews are layout diagrams; validated cover directions use generated samples.
const SOURCE_BASE = "https://github.com/freestylefly/awesome-gpt-image-2/blob/63e6176fa01be51c000108dacd72716d3e46784b/docs/templates.md#tpl-";
const RECIPES = [
  [
    "concept-type",
    "概念字体 · 编辑海报",
    "让标题成为画面的一部分",
    "poster",
    "type",
    "#eee6d4",
    "#191d22",
    "#d64b35",
    "用文章核心矛盾决定字形、尺度和负空间，让一个明确物件与标题产生有意义的穿插关系。",
    "Editorial conceptual typography, monumental legible letterforms, one interacting metaphor, restrained vermilion and warm ivory, subtle lithographic grain. Typography and subject share a deliberate visual hierarchy; no word-art effects."
  ],
  [
    "paper-world",
    "层叠纸雕 · 微型世界",
    "适合成长、方法与生活主题",
    "illustration",
    "paper",
    "#efe7d4",
    "#204c49",
    "#d78953",
    "把文章观点变成有前中后景的纸雕场景，明确每层轮廓、遮挡关系与人物动作。",
    "Hand-cut layered paper illustration, visible paper thickness and clean cut edges, sculpted overlapping silhouettes, soft contact shadows, forest teal, apricot and warm cream. Build a coherent small world, never a scrapbook of unrelated icons."
  ],
  [
    "watercolor-field",
    "水彩手记 · 轻盈叙事",
    "适合旅行、自然与生活观察",
    "illustration",
    "watercolor",
    "#f4efe4",
    "#385d63",
    "#dba671",
    "用文章中的地点、物件或行为构成疏朗水彩场景，保留明确焦点和充足呼吸。",
    "Transparent watercolor washes on cold-pressed white paper, pigment blooms, sparse graphite detail, muted sea green and ochre. Preserve crisp focal details within soft edges, generous unpainted space, no glossy digital finish."
  ],
  [
    "knowledge-flow",
    "知识流程 · 清晰路径",
    "解释方法、流程与因果关系",
    "infographic",
    "flow",
    "#f0f3ec",
    "#244749",
    "#d69a39",
    "只从正文提取3至5个真实步骤或因果节点，说明连接方向；不是流程的内容不要硬编顺序。",
    "Precise editorial process infographic with three to five distinct nodes, directional connectors, consistent pictograms, disciplined spacing, ivory field, deep teal and one ochre accent. Few short labels, clear reading order, no decorative dashboard."
  ],
  [
    "side-by-side",
    "双向对比 · 观点对照",
    "解释两种机制或选择的差异",
    "infographic",
    "compare",
    "#f3eee4",
    "#30596a",
    "#d7775b",
    "只比较文章明确出现的两种方案，保持比较维度一致；没有数值就用结构与场景对照，不生成统计图。",
    "Balanced two-part comparison with matched scale and aligned visual criteria, one coherent conceptual contrast, navy versus terracotta on cream. Show structural differences, not unsupported winner badges or numerical superiority."
  ],
  [
    "science-scale",
    "科学尺度 · 由微至宏",
    "适合分层系统与科普解释",
    "infographic",
    "scale",
    "#eaf0f1",
    "#253c54",
    "#d29843",
    "将正文明确存在的层级组织为3至6个递进观察框；单位和倍率只采用正文事实，不编造精确测量。",
    "Scientific editorial atlas with progressive nested observation windows, fine leader lines, detailed focal specimens, calm blue-gray and amber accents. Distinct observable scales, accurate relationships, compact labels rather than paragraphs."
  ],
  [
    "exploded-system",
    "结构拆解 · 原理图解",
    "解释组件、连接与工作原理",
    "other",
    "exploded",
    "#ecf0ef",
    "#31536a",
    "#d99442",
    "挑选文章中的一个真实系统，展示3至5个部件及其连接或分层关系；抽象比喻明确按概念图表达，不捏造产品规格。",
    "Clean exploded technical illustration, aligned layers separated along one assembly axis, precise orthographic or gentle axonometric view, restrained blue-gray linework and amber functional highlights. White technical-paper field, logical connections, no invented dimensions."
  ],
  [
    "isometric-room",
    "等距微缩 · 系统场景",
    "将协作、空间和系统可视化",
    "architecture",
    "iso",
    "#ede9df",
    "#285554",
    "#d48c55",
    "把正文的系统或协作关系变成一个可读的剖切空间，固定等距视角，明确人物与设施的关系。",
    "Isometric cutaway miniature environment, consistent parallel projection, readable rooms and functional pathways, detailed solid materials, warm timber, muted teal and soft daylight. One connected environment, no disconnected floating interface cards."
  ],
  [
    "cinematic-story",
    "电影叙事 · 冲突瞬间",
    "用正在发生的事件承载观点",
    "scene",
    "cinema",
    "#14262c",
    "#ebddbd",
    "#d97842",
    "把文章核心矛盾安排为一个正在发生的动作，明确主体、阻力、前景中景远景和定向光源。",
    "Cinematic editorial still, decisive human action, foreground framing, atmospheric depth, strong directional light, deep petrol shadows and warm amber highlights, subtle film grain. One meaningful event, no montage, no generic AI symbols."
  ],
  [
    "documentary-lens",
    "纪实镜头 · 真实质感",
    "适合人物、工作与日常场景",
    "photo",
    "photo",
    "#dfdad0",
    "#304148",
    "#be8152",
    "从文章提取可观察的真实日常情境，不把比喻伪装成新闻证据；指定人物动作、环境痕迹和自然光。",
    "Editorial documentary photograph aesthetic, natural 35mm perspective, physically plausible daylight, honest material textures, quiet environmental detail, restrained film grain. Deliberate but unforced composition; generated conceptual illustration, never fabricated documentary proof."
  ],
  [
    "ink-landscape",
    "水墨留白 · 东方意境",
    "适合阅读、思考与长期主义",
    "history",
    "ink",
    "#f2efe4",
    "#263c3a",
    "#b65943",
    "用山水、器物或人的行动表达文章观点，黑墨浓淡形成空间，朱色仅作一点强调；不冒用书法家签名或名作构图。",
    "Contemporary ink-wash editorial landscape, expressive wet and dry brush, layered tonal mountains, asymmetric open space, warm rice-paper surface and one restrained cinnabar accent. A small purposeful human presence, no copied masterwork, seals or signature."
  ],
  [
    "object-editorial",
    "物件隐喻 · 棚拍静物",
    "让单个物件解释一个清楚观点",
    "product",
    "object",
    "#e9e2d6",
    "#36534f",
    "#b37d46",
    "选择文章中有依据的一个物件或有清楚解释的物件变形，写明它怎样呈现观点；不要凭空添加品牌、卖点或价格。",
    "Premium editorial still life, one thoughtfully transformed physical object, tactile material detail, sculptural side light, subtle grounded shadow, restrained warm neutral backdrop with muted teal. Concept-led rather than generic e-commerce display; no brand logos, pricing or sales claims."
  ],
  [
    "human-narrative", "人物叙事 · 手绘编辑", "用人物动作、情绪与环境讲述经历",
    "illustration", "photo", "#f3dfc4", "#183e78", "#d56a32",
    "从当前段落提取一个有依据的人物行为，说明动作、视线、情绪及环境的关系。人物不是装饰小剪影，不固定为工作室、女性或举色纸。",
    "Mature editorial gouache and colored-pencil illustration, expressive human posture and gaze, confident overpaint, imperfect edges and fine print grain. One observed human moment within a coherent environment, considered ultramarine and warm earth colors, natural light and atmospheric depth. No generic corporate characters or unrelated teaching icons."
  ],
  [
    "opinion-collage", "观点拼贴 · 视觉评论", "用裁切、尺度反差与强色表达观点",
    "poster", "type", "#f3eadb", "#191c23", "#e04427",
    "先提炼正文立场，再选择两到三个有明确关系的图像片段，通过裁切、尺度、遮挡或形状呼应表达。每个片段都必须服务同一个观点；不固定为眼睛、手或色卡。",
    "Art-directed editorial collage with two or three meaningfully connected photographic fragments and tactile torn-paper shapes, sharp scale contrast, restrained monochrome plus one or two bold spot colors, halftone and paper fibers. One unified visual argument, not a random moodboard, card grid or collection of stickers."
  ],
  [
    "literary-painting", "文学绘画 · 留白意象", "适合随笔、阅读与情绪表达",
    "illustration", "watercolor", "#e9d5ba", "#253e64", "#c77b3d",
    "从正文的情绪、处境或观察提炼一个独立绘画意象，以人物、环境或光色关系承载意味，不逐条图解全文。地点、动作和配色随文章变化，不固定为海边、橙色外套或纸框。",
    "Poetic literary editorial painting in layered gouache and oil pastel, expressive confident brushwork, atmospheric color masses, tactile pigment and warm printed-paper grain. One evocative human or environmental relationship, emotional depth and restrained detail, deliberate open space. No diagram, glossy CGI, clip-art symbols or copied masterwork."
  ]
];
function previewSvg(kind, bg, ink, accent) {
  const shapes = {
    type: `<text x="28" y="105" font-size="69" font-weight="900" fill="${ink}">IDEA</text><circle cx="246" cy="94" r="44" fill="${accent}" opacity=".8"/><path d="M58 150H278" stroke="${ink}" stroke-width="7"/>`,
    paper: `<path d="M0 140Q90 32 190 115T360 85V220H0" fill="${ink}"/><path d="M0 168Q150 68 360 150V220H0" fill="${accent}"/><path d="M0 192Q200 130 360 185V220H0" fill="#faf4e4"/><circle cx="272" cy="56" r="25" fill="${accent}"/>`,
    watercolor: `<ellipse cx="155" cy="117" rx="115" ry="59" fill="${ink}" opacity=".18"/><ellipse cx="226" cy="100" rx="65" ry="49" fill="${accent}" opacity=".32"/><path d="M53 153Q135 60 212 150T305 113" fill="none" stroke="${ink}" stroke-width="3"/>`,
    flow: [40,145,250].map((x,i)=>`<rect x="${x}" y="80" width="68" height="62" rx="12" fill="${i===1?accent:ink}"/><text x="${x+24}" y="119" fill="white" font-size="22">${i+1}</text>${i<2?`<path d="M${x+74} 111h25m-7-6 7 6-7 6" fill="none" stroke="${ink}" stroke-width="3"/>`:''}`).join(''),
    compare: `<rect x="30" y="48" width="135" height="130" rx="5" fill="${ink}"/><rect x="190" y="48" width="135" height="130" rx="5" fill="${accent}"/><path d="M55 143l27-55 28 55 27-55M215 90h83m-83 25h60m-60 25h83" stroke="${bg}" stroke-width="7" fill="none"/>`,
    scale: [26,43,65].map((r,i)=>`<circle cx="${65+i*111}" cy="112" r="${r}" fill="none" stroke="${i===1?accent:ink}" stroke-width="3"/><circle cx="${65+i*111}" cy="112" r="8" fill="${accent}"/>`).join(''),
    exploded: [0,1,2].map(i=>`<path d="M180 ${43+i*50}l83 31-83 31-83-31z" fill="${i===1?accent:ink}" opacity="${1-i*.18}"/>`).join(''),
    iso: `<path d="M180 35l111 61v77l-111 44-111-62V96z" fill="${accent}"/><path d="M180 35v120l111-59M180 155l-111-59v59l111 62z" fill="${ink}"/><path d="M180 155l111-59v77l-111 44z" fill="#c6d7c9"/>`,
    cinema: `<path d="M0 174L108 43l86 131 95-114 71 114V220H0" fill="${ink}"/><path d="M230 15L130 220H360z" fill="${accent}" opacity=".35"/><circle cx="181" cy="128" r="9" fill="${bg}"/><path d="M181 139v37m0-22-18 12m18-12 17 9m-17 13-12 27m12-27 12 27" stroke="${bg}" stroke-width="5"/>`,
    photo: `<rect x="48" y="35" width="266" height="155" fill="${ink}"/><path d="M53 165L150 70l75 112M207 38v145m22-145v145" stroke="${accent}" stroke-width="7"/><circle cx="134" cy="101" r="22" fill="${bg}"/><path d="M95 178q5-64 40-49t43 49" fill="${bg}"/>`,
    ink: `<path d="M18 176L96 51l37 75 50-93 74 116 49-49 44 76" stroke="${ink}" stroke-width="6" fill="${ink}" opacity=".65"/><path d="M10 202Q167 145 350 195" stroke="${ink}" stroke-width="2" fill="none"/><circle cx="283" cy="50" r="16" fill="${accent}"/>`,
    object: `<ellipse cx="182" cy="179" rx="89" ry="12" fill="${ink}" opacity=".13"/><path d="M132 74h100l-13 100h-74z" fill="${ink}"/><path d="M156 84l28-37 28 37-28 38z" fill="${accent}"/><path d="M239 91q62-5 38 50h-44" stroke="${ink}" stroke-width="13" fill="none"/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="230" viewBox="0 0 360 230"><rect width="360" height="230" fill="${bg}"/>${shapes[kind]}<rect y="210" width="360" height="20" fill="${bg}"/><text x="12" y="224" font-family="sans-serif" font-size="10" fill="${ink}">LAYOUT STUDY / 构图示意 · 非生成效果</text></svg>`;
}
const COVER_DIRECTIONS = {
  'gpt-concept-type': {
    name: '概念字体 · 纸艺封面', description: '大标题、真实纸艺与精确留白', preview: 'gpt-concept-type',
    planning: '从文章提取一个能由物件变化解释的核心矛盾，策划一个具体、可绘制的纸艺或印刷装置。写清楚主体材质、哪部分穿插标题、视觉焦点和光线。不要把所有文章都变成同一个纸块；主体随文章观点变化。',
    art: 'Art-directed conceptual typography with a tactile paper or print sculpture. Warm ivory, deep near-black typography and one restrained vermilion accent. Convincing folds, cut edges, thin layered occlusion and grazing studio light. A single meaningful physical transformation expresses the supplied article idea. Let forms pass behind or through a controlled part of the typographic composition without obscuring any character. Make the exact requested headline the main compositional mass, with excellent spacing, semantic line breaks and intentional asymmetrical balance. Fine material detail and restrained print grain. No word-art effects, icon collection, basic geometric placeholder, sticker collage or generic gradient.'
  },
  'gpt-cinematic-story': {
    name: '电影光影 · 空间叙事', description: '人物与环境发生关系，标题融入光影', preview: 'gpt-cinematic-story',
    planning: '将文章的一个观点变成正在发生的具体事件，明确人物在观察或改变什么，环境如何参与。给出前景、中景动作和远景，以及一个主光源；为标题规划安静、完整的明暗区域。人物、环境与行动随文章变化，不固定成展厅或某件雕塑。',
    art: 'A cinematic editorial scene with a specific relationship among protagonist, meaningful object and environment. Deep foreground shadow, convincing middle-ground action and a readable distant space; strong perspective and finely observed tactile material. Controlled amber directional light and charcoal shadows, coherent atmospheric depth, premium film-still quality. Integrate the complete headline prominently into a calm shadow plane with elegant warm-white display typography, legible at thumbnail size. Adapt placement to the scene rather than attaching a tiny corner caption. No cyberpunk neon, HUD, diagram boxes, sales cards or floating abstract props.'
  },
  'gpt-human-narrative': {
    name: '人物叙事 · 手绘编辑', description: '人物、动作与情绪，让封面更有温度', preview: 'gpt-human-narrative',
    sourceUrl: 'https://www.newyorker.com/culture/cover-story/cover-story-2022-07-25', sourceLabel: '编辑叙事 · 设计参考',
    planning: '从文章选择一个有依据的人物行为或处境，明确人物在做什么、看向哪里，以及环境如何参与。写出一个主要动作、可信的表情与手部、前中后景和自然光。人物要可见且有表现力；不固定为工作室、某个性别或举色纸。标题开启时规划安静、对比清楚的区域。',
    art: 'Mature hand-painted editorial gouache and colored pencil, expressive human presence with convincing gesture, gaze and hands, one meaningful observed moment rather than an explanatory mechanism. Confident shapes, subtle overpaint, imperfect edges, tactile printed-ink grain, coherent foreground, middle ground and background. A considered palette with rich ultramarine and warm earth accents adapted to the article. When text is requested, use substantial modern Chinese sans-serif typography in a calm part of the continuous scene, with optical spacing and natural line breaks. No generic corporate illustration, tiny decorative person, cute mascot, tutorial arrows or unrelated icons.'
  },
  'gpt-opinion-collage': {
    name: '观点拼贴 · 视觉评论', description: '裁切、尺度与强色，让观点更鲜明', preview: 'gpt-opinion-collage',
    sourceUrl: 'https://www.pentagram.com/work/tablet-magazine', sourceLabel: '编辑拼贴 · 设计参考',
    planning: '先用一句话写清文章立场，再选择两到三个有明确关系的视觉片段，写明裁切、尺度反差或遮挡怎样表达该观点。保留一个焦点，避免素材板和多张小卡。主体随文章变化，不固定为眼睛、手和色卡；不冒用他人肖像、品牌或刊名。',
    art: 'A bold cultured editorial photo-and-paper collage expressing one clear visual argument. Two or three related fragments, radical yet controlled crop and scale, deliberate overlap, monochrome photography with one or two strong spot colors, visible paper fibers, scissor contours and coarse photographic halftone. Asymmetrical tension and a unified composition, not a moodboard or grid. When requested, set the complete headline in large assured modern Chinese grotesk, carefully spaced in quiet negative space. No unrelated fragments, fake charts, medical diagrams, stock business presentation, publication marks or arbitrary slogans.'
  },
  'gpt-documentary-lens': {
    name: '生活摄影 · 安静纪实', description: '自然光、生活痕迹与克制的排版', preview: 'gpt-quiet-photo',
    sourceUrl: 'https://alexhunting.studio/pages/about', sourceLabel: '生活摄影 · 编辑设计参考',
    planning: '从文章选择可观察的生活动作、人物或环境痕迹，说明人物与物件的关系、镜头距离、自然光和留白。不把生成场景当新闻证据，不编造真人经历；不固定为桌面、手部或纸样，不堆满装饰道具。标题开启时利用真实明暗与安静区域。',
    art: 'Quiet editorial lifestyle photography, candid close observation, natural 35mm perspective, plausible daylight and soft shadows, everyday material wear and fine restrained film grain. One unforced human action or meaningful environmental detail, muted colors with a subtle warm accent, deliberate negative space and coherent depth. When text is requested, use confident, legible contemporary editorial typography placed in a naturally calm region with no opaque card. No sterile luxury showroom, stock business handshake, overprocessed sepia, elaborate props, fake screenshots or fabricated documentary evidence.'
  },
  'gpt-literary-painting': {
    name: '文学绘画 · 留白意象', description: '用光色、笔触与一个意象表达感受', preview: 'gpt-literary-painting',
    sourceUrl: 'https://www.pentagram.com/work/the-paris-review', sourceLabel: '文学艺术 · 编辑设计参考',
    planning: '提炼文章情绪、处境或观察，选择一个有意味的绘画场景，让光色、人物与环境的关系承载感受。不是逐条解释全文。给出一处视觉转折和清楚焦点，地点、动作及配色随文章变化，不固定为海边、橙色外套和纸框。根据当前画幅重新构图，标题开启时保留足够对比。',
    art: 'A poetic original literary editorial painting, layered gouache and oil pastel, rich atmospheric color masses, expressive confident brushwork, imperfect pigment edges and tactile printed-paper grain. A single evocative human or environmental relationship, emotional depth and deliberate open space rather than an explanatory diagram. Adapt colors and subject to the article, not the sample scene. When text is requested, compose the full headline with strong thumbnail readability and thoughtful line breaks; plan its font and hierarchy separately from the painting medium, following the supplied typography brief. No glossy CGI, corporate clip art, technical labels, decorative stickers, borrowed publication identity or copied painting.'
  },
  'gpt-object-editorial': {
    name: '质感静物 · 物件隐喻', description: '一个有意义的物件，材质与文字共同表达', preview: 'gpt-object-editorial',
    planning: '从文章核心观点选择一个可以解释的物件及其变化，写明粗糙与精细、内外或前后的关系为何有正文依据。只保留一个主体，说明材质、可见结构、接触阴影和标题留白。不要每次都使用石膏方块，也不要添加正文没有的品牌或卖点。',
    art: 'Premium metaphorical still-life photography of one intriguing, physically coherent object that carries the supplied article idea. Macro-level tactile detail, believable edge thickness, fine tool marks, contrasting rough and refined materials, sculptural side light and a soft grounded shadow. Warm stone, graphite and a restrained copper accent. Balance the object against a large confident complete headline with excellent spacing and purposeful hierarchy, like an independent design magazine feature. Choose the object from the article rather than repeating the sample object. No collection of symbols, infographic, flat icon, sales dashboard, generic stock product layout or decorative badge.'
  }
};
const ARTICLE_RULES = '从当前文章提取一个有依据的观点和可绘制主体。尊重用户指定画幅，不固定为竖版海报。不得编造数字、收益、评价、引语或文章未支持的事实；资料不足时少放标签。每次只策划一张，多个候选改变核心场景而不只换颜色。';
const EDITORIAL_TYPE_IDS = new Set(['gpt-human-narrative', 'gpt-opinion-collage', 'gpt-documentary-lens', 'gpt-literary-painting']);
const EDITORIAL_TYPE_RULES = 'When text is requested, art-direct typography separately from the illustration. Default to a heavy, compact modern Chinese sans-serif headline: solid even strokes, clean squared terminals and a dense confident silhouette, with optically matched Latin AI and other Latin words. Supporting text may be smaller and lighter. Read the exact title for semantic groups, retain a smaller premise or lead-in when appropriate, and choose at most one meaningful consecutive keyword already present in the title as the focal emphasis. That keyword may be larger, with one controlled accent color sampled from the article palette; when sharing a line, align mixed sizes on one optical baseline and preserve seamless reading order. If no meaningful emphasis exists, use size and spacing rather than inventing one. Never invent a number, subtitle, claim or word to imitate a sample. Preserve the complete wording and punctuation. Use a strict alignment edge, generous outer margins, compact measured tracking, balanced line lengths and comfortable line spacing. Give only one element the strongest visual weight, not three equally huge lines, and do not fill all available space. Default to horizontal reading; vertical typography or a serif face requires an explicit user request, not merely a painterly background. Adapt contrast for the actual background. No outlines, heavy shadows, artificial stretching, arbitrary multi-color words or default mixed font families. Explicit user font, arrangement and emphasis instructions take priority. For text-free images none of these typography instructions apply.';
const EXTRA_TEMPLATES = RECIPES.map(([id,name,description,category,kind,bg,ink,accent,planning,visual]) => ({
  id: 'gpt-'+id, name, description, titleTreatment: 'adaptive',
  sourceUrl: SOURCE_BASE+category, sourceLabel: 'Awesome GPT Image · 分类参考',
  previewSvg: previewSvg(kind,bg,ink,accent), previewKind: 'schematic',
  planningPrompt: ARTICLE_RULES+planning+'封面只使用用户标题，不添加虚构副标题；用英文描述可绘制场景。',
  imagePrompt: 'Create one finished article cover.\nScene: {concept}\n'+visual+'\nCanvas: {width} x {height} px, aspect ratio {ratio}. Compose specifically for this ratio with 6 percent safe margins.\n{text_rule}\nNo watermarks, signatures, unrelated labels, fake metrics, brands, multi-option moodboards or reference-site UI.',
  figurePlanningPrompt: ARTICLE_RULES+planning+'为当前正文段落解释关系，不复制封面版式，不放文章标题。短标签只能来自该段落，除非用户要求，不加入其他文字。',
  figurePrompt: 'Create one article-body illustration explaining the supplied paragraph.\nScene: {concept}\n'+visual+'\nCanvas: {width} x {height} px, aspect ratio {ratio}, with 6 percent safe margins.\n{text_rule}\nNever render the article headline or carry over a fixed cover layout. For the typography style, express the concept with shapes and objects when short labels are not requested. No invented data, quotes, numerical scales, logos or watermarks.',
  defaults: {textLevel: 'title'}
})).map(template => {
  const direction = COVER_DIRECTIONS[template.id];
  if (!direction) return { ...template, coverReady: false };
  return { ...template, name: direction.name, description: direction.description,
    sourceUrl: direction.sourceUrl || template.sourceUrl, sourceLabel: direction.sourceLabel || template.sourceLabel,
    coverReady: true, coverPreviewAsset: direction.preview, coverPreviewKind: 'generated-sample',
    planningPrompt: ARTICLE_RULES + direction.planning + (EDITORIAL_TYPE_IDS.has(template.id) ? '文字开启时单独规划厚实紧凑黑体、语义断行和主次层级。最多从标题里选择一个有意义的连续关键词放大或单色强调，其余文字退让，混排时共享基线；不为模仿参考图杜撰数字或改写原文。严格对齐并留足边距，不把整句话每一行都放到最大。默认横排；宋体和竖排仅在用户明确要求时采用，不由绘画背景自动决定。' : '') + '严格遵守当前文字开关；仅在要求文字时使用用户完整标题，不添加虚构副标题。用英文给出可绘制的场景。',
    imagePrompt: 'Create one finished premium editorial article cover.\nScene: {concept}\n' + direction.art + (EDITORIAL_TYPE_IDS.has(template.id) ? '\n' + EDITORIAL_TYPE_RULES : '') + '\nCanvas: {width} x {height} px, aspect ratio {ratio}. Compose the entire cover specifically for this ratio with 6 percent safe margins; never crop a taller poster.\n{text_rule}\nThe text rule above takes absolute priority over any headline or typographic styling guidance: when it requests no text, render only the visual scene without lettering. Never reproduce the example subject by default.\nNo added bylines, unsupported subtitles, watermarks, signatures, fake metrics, brands, contact sheets or reference-site UI.'
  };
});
EXTRA_TEMPLATES.push(...require('./editorial').EDITORIAL_TEMPLATES, ...require('./researched').RESEARCHED_TEMPLATES);
module.exports = { EXTRA_TEMPLATES };

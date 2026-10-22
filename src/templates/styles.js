'use strict';

// Additive visual systems. Existing recipes and saved IDs remain unchanged.
// Sample content belongs to previews only; it is never part of a generation prompt.
const SAMPLE_TITLE = '生活，值得重新想象';
const STYLES = [
  {
    id: 'style-magazine', name: '杂志风', en: 'Magazine', description: '全幅摄影、精致宋体与穿插字级，像一张文化刊物封面', descriptionEn: 'Full-bleed photography, refined serif type and layered editorial hierarchy', sheet: 'editorial', cell: 0,
    type: 'High-contrast Chinese Song/Ming editorial serif paired with a restrained sans only when needed. Fine-to-thick stroke contrast, deliberately varied type sizes and elegant optical spacing; keep small-format readability. Do not default to heavy Heiti.',
    layout: 'Build one full-bleed photographic field. Let the complete headline cross or nest into its quiet architectural planes, with a sophisticated large/small hierarchy. Typography and image may overlap without obscuring a face or any title character. Do not divide the canvas into a fixed left text/right picture pair.',
    material: 'Culture and fashion editorial photography: observed gesture or sculptural environmental detail, real material texture, deliberate lens perspective and sculpted daylight. A small rich neutral palette, photographic tonal depth and tactile matte magazine print.',
    avoid: 'Fake mastheads, cover lines, issue numbers, publisher identity, decorative UI cards or copied magazine compositions.'
  },
  {
    id: 'style-fresh', name: '清新风', en: 'Fresh and airy', description: '轻盈圆体、透亮自然光与疏朗留白，安静而有生活气息', descriptionEn: 'Light rounded type, translucent daylight and open breathing space', sheet: 'editorial', cell: 1,
    type: 'Light or regular rounded Chinese sans, generously but naturally spaced, soft precise edges and an airy rhythm. Use sufficient weight and contrast to stay readable; never a dense black headline.',
    layout: 'A spacious centered headline floats in an open field; a low asymmetrical scene or organic detail anchors the image. Light and the natural edges of the subject organize the composition. Change scale and placement for each article rather than using two equally sized side-by-side zones.',
    material: 'Luminous everyday lifestyle photography, translucent fabrics or leaves, soft morning daylight and clean whites with pale botanical or article-appropriate natural hues. Real soft shadow, restrained depth and fresh uncoated-paper finish.',
    avoid: 'Heavy black slabs, dark cinematic grading, luxury product advertising, dense stickers or generic pastel presentation cards.'
  },
  {
    id: 'style-minimal', name: '极简风', en: 'Minimalist', description: '小尺度标题、单一视觉线索与大量留白，让空间成为主体', descriptionEn: 'Small deliberate type, a single visual cue and dominant negative space', sheet: 'editorial', cell: 2,
    type: 'Restrained regular Chinese sans, small relative to the canvas but clear at thumbnail size, precise tracking and only one typographic level. No oversized bold headline.',
    layout: 'Let roughly three quarters of the field remain intentionally empty. One small article-specific visual cue and the complete headline form a distant spatial relationship; a low centered title is a starting possibility, not a mandatory position. No illustration/title halves or enclosing card.',
    material: 'Chalk white or a single quiet paper field, one sharply observed object, precise soft light and a tiny grounded shadow. Extreme reduction, optical balance, subtle genuine material detail rather than decorative texture.',
    avoid: 'Multiple props, ornament, random geometric filler, several accent colors, drop-shadow cards or a headline filling the frame.'
  },
  {
    id: 'style-retro', name: '复古风', en: 'Midcentury retro', description: '圆润展示字、平面插画与旧印刷质感，带有鲜明年代气息', descriptionEn: 'Rounded display lettering, illustrated color planes and vintage offset texture', sheet: 'editorial', cell: 3,
    type: 'Rounded substantial Chinese display lettering with a midcentury printed character, slightly buoyant rhythm and clean intact strokes. A shallow arc or stepped baseline may be used only when natural and readable.',
    layout: 'An illustrated scene occupies the whole page while the headline follows an upper arch, broad inset or other scene-led curve. Use bold interlocking color planes and asymmetrical masses; do not put modern black type to the left of a stock retro object.',
    material: 'Original midcentury offset-print illustration, faded olive, warm tangerine, ochre and cream adapted to the subject, visible paper tooth and slight illustration ink wear. Simplified rounded furniture, environments or people, flat spatial warmth rather than photographic nostalgia filters.',
    avoid: 'Borrowed old advertisements, fabricated dates or prices, tourism logos, severe distressed lettering or generic sepia photographs.'
  },
  {
    id: 'style-journal', name: '手账风', en: 'Personal scrapbook', description: '手写标题、斜置照片与撕纸叠层，像认真整理的一页生活', descriptionEn: 'Handwritten title, angled photographs and tactile torn-paper layers', sheet: 'editorial', cell: 4,
    type: 'Relaxed clean handwritten Chinese with a consistent pen character, complete legible strokes and human rhythm. The headline can sit on a physical paper strip, but must not become a heavy digital sans-serif block.',
    layout: 'Use a diagonal physical arrangement of a few paper fragments, one meaningful image and a small drawn detail. The headline sits on or crosses a central paper layer. Overlap, irregular edges and empty tabletop create intimacy; no rigid title/photo split or crowded moodboard.',
    material: 'Real torn uncoated paper, translucent tape, analog photograph, pencil and one restrained colored-pencil accent. Believable layer thickness, coherent cast shadows and careful handmade marks.',
    avoid: 'Invented personal memories, fake diary paragraphs, postage text, signatures, crowded stickers or copied photographs.'
  },
  {
    id: 'style-chinese', name: '国风', en: 'Contemporary Chinese', description: '宋体竖排、宣纸与淡墨意境，疏密之间留出东方气韵', descriptionEn: 'Vertical Song-serif type, rice paper and restrained ink atmosphere', sheet: 'editorial', cell: 5,
    type: 'Refined Chinese Song/Ming serif with clear stroke contrast. Vertical columns are an intentional option, preserving top-to-bottom, right-to-left semantic order and punctuation; adapt to horizontal setting when the title contains long Latin words or the user requests it. Never default to heavy contemporary sans.',
    layout: 'Balance a sparse ink scene in one low region against tall title columns and a large unpainted field. Think in empty/full, near/far and wet/dry relationships. The title and art share a poetic page rather than a Western left-heading/right-icon template.',
    material: 'Contemporary original Chinese ink painting on subtly fibrous rice paper, translucent washes, expressive dry brush and a single quiet cinnabar accent without inscription. Choose an image from this article, not a default mountain, woman or temple.',
    avoid: 'Fake artist seals, signatures, invented classical quotations, borrowed calligraphy, tourist decoration or unreadable cursive title strokes.'
  },
  {
    id: 'style-film', name: '电影风', en: 'Cinematic poster', description: '叙事场景、戏剧光影与底部片名字级，让画面先讲故事', descriptionEn: 'Narrative scenes, dramatic light and restrained lower poster typography', sheet: 'screen', cell: 0,
    type: 'Condensed but clean Chinese Song-serif film-poster lettering, deliberate tracking and restrained weight. A modest complete two-line headline can sit low in the frame; no giant central slogan obscuring the scene.',
    layout: 'One immersive full-bleed scene with foreground, middle ground and distance. Camera angle, a meaningful action and a light path lead the eye before the lower title. Recompose for portrait without adding letterbox bars, fake credits or a separate blank panel.',
    material: 'Cinematic photographic realism, motivated practical or daylight sources, deep but readable shadows, atmospheric depth, restrained lens bloom and film grain. Color grade serves the article mood, not a fixed teal-orange filter.',
    avoid: 'Movie franchise imagery, copied actor likeness, fake credits, release dates, awards, cinema logos or meaningless tiny people.'
  },
  {
    id: 'style-pop', name: '波普风', en: 'Pop art', description: '网点、撞色与爆炸形文字区，鲜明直接又有印刷张力', descriptionEn: 'Halftone dots, bold spot colors and an expressive headline burst', sheet: 'screen', cell: 1,
    type: 'Chunky playful Chinese display lettering, optically spaced with a strong black outline only if helpful. The complete title occupies one expressive speech-burst or cut shape; every character remains readable.',
    layout: 'A striking off-center title burst interacts with oversized flat subject fragments and one energetic ray or dot field. Crop and scale create tension. Avoid a quiet modern title zone beside a single object.',
    material: 'Original pop-art screenprint, comic halftone dots, sharply inked contours and saturated yellow, red and blue or a coherent article-specific spot palette. Flat graphic impact and visibly printed surfaces, no photographic gradients.',
    avoid: 'Copied pop-art paintings, superhero emblems, extra exclamations, invented quotes, multiple speech balloons or decorative label clutter.'
  },
  {
    id: 'style-playful', name: '童趣风', en: 'Playful cut-paper', description: '不规则剪纸、蜡笔笔触与跳跃字形，轻松而富有想象力', descriptionEn: 'Irregular paper shapes, wax-crayon marks and lively rounded lettering', sheet: 'screen', cell: 2,
    type: 'Friendly rounded Chinese lettering with a gently staggered baseline, complete clean characters and large generous counters. Type belongs to the playful illustration rather than a formal editorial grid.',
    layout: 'Let handmade shapes surround and weave through a middle headline. Use scale surprises, off-kilter balance and a small visual joke derived from the article; keep one unmistakable reading path. No fixed adult-corporate title/illustration columns.',
    material: 'Naive hand-cut paper and wax crayon, warm peach, butter yellow and pistachio or similarly coherent playful hues. Irregular scissor edges, visible crayon tooth and simple expressive shapes, sophisticated restraint rather than clip-art.',
    avoid: 'Licensed characters, random smiling faces on every object, preschool worksheet clutter, business vector people or additional slogans.'
  },
  {
    id: 'style-cyberpunk', name: '赛博朋克', en: 'Cyberpunk noir', description: '夜景、霓虹反射与棱角科技字，呈现高密度未来氛围', descriptionEn: 'Neon night scenes, reflective depth and angular technical type', sheet: 'screen', cell: 3,
    type: 'Angular precise Chinese techno sans with crisp intact strokes and tightly controlled luminous accents. Short horizontal semantic lines may form an edge stack. No corrupted glyphs or generic heavy black editorial type.',
    layout: 'An immersive dense future environment with a strong perspectival diagonal, reflective foreground and a clear lit subject. The exact title can climb a tall edge through short lines, clear of key action. No fake interface frame or obligatory left title/right object.',
    material: 'Gritty cinematic near-future photographic realism, wet material reflections, electric cyan and magenta against deep charcoal, motivated neon lighting and believable atmospheric depth. Reinterpret this article without default robots or generic circuit boards.',
    avoid: 'Fake code, HUD labels, invented numbers, corporate sci-fi dashboards, franchise imagery or glitch effects that damage title characters.'
  },
  {
    id: 'style-y2k', name: '千禧风', en: 'Y2K chrome', description: '液态铬字、透明塑料与闪光高光，突出千禧年的未来想象', descriptionEn: 'Liquid-chrome lettering, translucent plastic and direct-flash highlights', sheet: 'screen', cell: 4,
    type: 'The exact Chinese title becomes one polished beveled or inflated chrome typographic object. Preserve each character counter and readable semantic spacing; dimensional lettering is the focal medium, not a flat bold black caption.',
    layout: 'A sculptural title passes through the center of an elastic fisheye-like scene, interacting with reflective material and transparent layers. Use very few large forms and exaggerated camera depth. Do not reserve a conventional flat white heading panel.',
    material: 'Early-2000s futurist chrome, translucent molded plastic, direct-camera-flash highlights, sharp glossy reflections and one small acid accent. Real material continuity and a coherent room, person or subject from the article.',
    avoid: 'Random star sticker packs, extra English slogans, copied brand identity, decorative UI buttons or unreadable melted characters.'
  },
  {
    id: 'style-vaporwave', name: '蒸汽波', en: 'Vaporwave', description: '粉紫空气、透视棋盘与复古喷绘字，带有梦境般的数字怀旧', descriptionEn: 'Pastel dusk, receding checkerboards and nostalgic airbrushed atmosphere', sheet: 'screen', cell: 5,
    type: 'Slender luminous Chinese display type with subtle airbrush softness outside crisp readable letter cores. A balanced high centered title leaves the dreamscape open; avoid chrome extrusion and cyberpunk angular type.',
    layout: 'A receding horizon, surreal scale and a calm upper title field form a spacious dream. Geometric floors or windows guide the eye into distance, chosen only when related to the article. No dense city collage or split card design.',
    material: 'Nostalgic pastel airbrush, lavender and rose dusk with muted teal, soft synthetic haze, carefully controlled checkerboard perspective and translucent glass-block depth. Quiet surreal digital nostalgia rather than neon action.',
    avoid: 'Fake Japanese text, Roman-bust clichés, VHS labels, random timestamps, chrome title objects or rain-soaked cyberpunk scenes.'
  },
  {
    id: 'style-art-deco', name: '装饰艺术风', en: 'Art Deco', description: '轴线对称、阶梯金线与几何衬线字，呈现克制的华丽', descriptionEn: 'Axial symmetry, stepped metallic rules and geometric serif lettering', sheet: 'print', cell: 0,
    type: 'Geometric Song/Ming-inspired Chinese serif with careful decorative spacing and an elegant clear two-level hierarchy. Frame the complete title without over-ornamenting individual strokes.',
    layout: 'A strong central axis, stepped architectural frame and fan-shaped or radiating ornaments balance the scene. Title and subject form one symmetrical poster, with generous breathing space between gold rules and letters.',
    material: 'Original Art Deco-inspired flat foil-print language, deep emerald or near-black, restrained brass-gold lines, geometric architectural silhouettes and luxurious matte stock. Metallic ink is flat and precise, not glossy CGI.',
    avoid: 'Historic brand logos, copied hotel posters, invented dates, ornate European fake crests or a plain left title/right object split.'
  },
  {
    id: 'style-art-nouveau', name: '新艺术风', en: 'Art Nouveau', description: '流动植物曲线、石版画色面与优雅字形，让文字长在画面里', descriptionEn: 'Flowing botanical contours, lithographic color and organically nested type', sheet: 'print', cell: 1,
    type: 'Graceful Chinese Song-serif display lettering with naturally flowing spacing and intact strokes. Nest the complete title inside an organic opening, without distorting character anatomy into vines.',
    layout: 'Let article-specific organic contours grow into an asymmetrical arch around a scene, with a headline nested low or off-center in its negative space. Continuous curves organize the page; avoid strict geometric grids and generic frame borders.',
    material: 'Original decorative botanical lithography, sinuous confident contour, muted olive, cream and dusky floral tones, flat layered ink and richly considered organic ornament. Article-specific plants or analogous forms, not a copy of a known artist composition.',
    avoid: 'Copied historic posters or artist signatures, default ornamental women, fake theater names, golden geometric fans or random floral wallpaper.'
  },
  {
    id: 'style-ukiyoe', name: '浮世绘风', en: 'Ukiyo-e woodblock', description: '木版轮廓、平远透视与和纸颗粒，文字融入画面留白', descriptionEn: 'Carved contours, flattened perspective and textured washi print', sheet: 'print', cell: 2,
    type: 'Sturdy clean Chinese Ming-serif title, preferably in two short vertical columns if the exact title supports it. Use accurate punctuation and reading order; do not invent Japanese lettering or signatures.',
    layout: 'A complete flattened-perspective scene with a decisive diagonal and layered foreground shapes. Title columns occupy natural print negative space, integrated into the image instead of placed on a modern white card.',
    material: 'Original ukiyo-e-informed multi-block woodprint, indigo and muted vermilion, confident carved contour lines, patterned environmental forms, subtle graduated ink and fibrous washi. New subject drawn from the article, not a famous wave or existing print.',
    avoid: 'Copied historical artworks, seals, artist names, extra Japanese text, default geisha or decorative faux museum labels.'
  },
  {
    id: 'style-nordic-folk', name: '北欧民艺风', en: 'Nordic folk', description: '对称花叶、木刻色块与朴拙字形，温暖且有装饰节奏', descriptionEn: 'Mirrored leaves, hand-carved shapes and warm folk typography', sheet: 'print', cell: 3,
    type: 'Friendly substantial block-serif Chinese, warm rather than severe, clean complete letter shapes. A central horizontal title band may tie together motifs growing above and below.',
    layout: 'Build a balanced radial or mirrored folk arrangement around one article-specific subject. The headline is woven into the center; ornament has repeated rhythm and breathing space. This is intentionally patterned and frontal, not photographic depth or left/right separation.',
    material: 'Scandinavian folk-craft-inspired hand-carved silhouettes, ochre, brick red, black and cream, stylized leaves or birds when justified, softly imperfect matte ink and uncoated paper. Simple confident shapes rather than ornamental realism.',
    avoid: 'Copied traditional emblems, commercial folk patterns, excessive tiny ornament, exact historic textile replication or fake dates.'
  },
  {
    id: 'style-linocut', name: '木刻版画风', en: 'Expressionist linocut', description: '黑白刀痕、斜向明暗与方正标题，粗粝而有力量', descriptionEn: 'Black-and-white carving, diagonal chiaroscuro and sturdy title lettering', sheet: 'print', cell: 4,
    type: 'Sturdy squared Chinese headline with clean internal strokes; a slight handmade edge may affect only the outer silhouette. Anchor it low against a clear light/dark mass, with no decorative serif flourish.',
    layout: 'One dramatic diagonal light path carves the scene into angular positive and negative shapes. A large foreground silhouette and compressed spatial depth carry the idea; headline sits in the opposing quiet mass. Avoid radial folk symmetry or standard two-column cards.',
    material: 'Original expressionist linocut, stark ivory and black, long directional carving gouges, visible hand-pressed ink and bold simplified volume. Marks follow the subject form, with no soft photographic gray gradient.',
    avoid: 'Copied political posters, propaganda symbols, chaotic scratches over letters, faux artist signatures, multicolor folk ornament or glossy shading.'
  },
  {
    id: 'style-risograph', name: '孔版印刷风', en: 'Risograph zine', description: '半色调、叠印与轻微错版，呈现独立刊物的手工印刷感', descriptionEn: 'Halftones, overprint and slight registration offsets on porous stock', sheet: 'print', cell: 5,
    type: 'Relaxed monospaced-feeling Chinese sans, moderate weight and two expressive semantic lines. The title itself stays sharply registered and intact even when the illustration ink is offset.',
    layout: 'A handful of large overlapping translucent silhouettes establish a deliberately offbeat rhythm. The headline can sit high across the composition, with object layers crossing beneath it. Avoid carved black/white hatching and tidy business-card alignment.',
    material: 'Original two- or three-drum risograph, fluorescent coral and cobalt on porous off-white stock, coarse visible halftone, slight illustration misregistration and deep overprint intersections. Flat ink density, not smooth vector transparency.',
    avoid: 'Fake issue numbers, random captions, halftone over title strokes, screenprinted slogans, perfect glossy digital gradients or a linocut finish.'
  },
  {
    id: 'style-oil', name: '厚涂油画风', en: 'Impasto oil', description: '厚重颜料、鲜明笔触与克制宋体，用光色承载情绪', descriptionEn: 'Raised pigment, directional brushwork and restrained literary serif type', sheet: 'drawn', cell: 0,
    type: 'Elegant readable Chinese Song-serif in a restrained contrasting tone. A low or quiet title respects the painting; never impose the same giant black sans used in graphic styles.',
    layout: 'Let painterly light and a meaningful scene fill the frame, with large atmospheric color masses and an intentionally quiet region for the complete title. Brush direction and spatial depth lead the eye. Do not reduce the painting to a small object beside type.',
    material: 'Original impasto oil painting, thick palette-knife pigment, piled physical paint ridges, layered opaque color and expressive directional brushwork. Rich warm/cool relationships and coherent light, no named-artist imitation.',
    avoid: 'Copied artworks, signatures, generic oil-filter photography, smooth vector shapes, diagram boxes or over-textured illegible title strokes.'
  },
  {
    id: 'style-watercolor', name: '植物水彩风', en: 'Botanical watercolor', description: '透明晕染、轻巧楷意与纸面留白，细腻而通透', descriptionEn: 'Transparent washes, light Kai-style lettering and luminous paper space', sheet: 'drawn', cell: 1,
    type: 'Delicate legible Chinese Kai-style or gentle literary serif, natural pen rhythm and moderate scale. A light upper centered title sits in unpainted paper; avoid a heavy sans headline.',
    layout: 'A translucent subject grows across the lower or outer edges, leaving a generous luminous central/upper opening for the title. Pigment blooms and paper whiteness create the structure, not framed panels. Botanical elements are optional and must connect to the article.',
    material: 'Original wet-on-wet watercolor, transparent layered washes, wet-edge diffusion, visible cold-press paper and fine botanical observation. Sage, dusty rose or article-specific natural pigment, preserving white paper light.',
    avoid: 'Fake specimen labels, copied botanical plates, invented species names, opaque gouache blocks, stock watercolor wreaths or dense bold lettering.'
  },
  {
    id: 'style-pencil', name: '铅笔速写风', en: 'Graphite sketch', description: '透视线稿、细密排线与手写字，保留观察和思考的痕迹', descriptionEn: 'Observed perspective, graphite crosshatching and clean handwritten type', sheet: 'drawn', cell: 2,
    type: 'Careful handwritten pencil-like Chinese with legible complete strokes, modest natural baseline variation and a dark-enough graphite tone. Do not simulate unreadable cursive or a printed black headline.',
    layout: 'Use a believable observed perspective sketch that gradually dissolves into blank paper. The title occupies an open region shaped by the drawing, possibly off-center; construction lines may guide the eye but do not become a data diagram.',
    material: 'Graphite drawing on warm-white sketch paper, varied pencil pressure, intentional crosshatching, light construction arcs and one small optional colored-pencil accent. Convincing form and hand observation, no digital line-art filter.',
    avoid: 'Fabricated notebook paragraphs, signatures, technical dimension labels, perfectly uniform vector strokes, excessive eraser dirt or copied sketches.'
  },
  {
    id: 'style-comic', name: '美式漫画风', en: 'Graphic novel', description: '戏剧透视、浓重墨线与斜向标题，像一个有张力的故事瞬间', descriptionEn: 'Dramatic foreshortening, heavy ink and a directional comic headline', sheet: 'drawn', cell: 3,
    type: 'Clean chunky Chinese display lettering with strong outline or narrow contrasting edge; a slight diagonal baseline can follow the action while every character stays intact. Not a pop-art speech bubble.',
    layout: 'One single narrative scene, an unusual camera angle and sweeping diagonal action. The full title rides the upper action line or another clear dynamic edge. Use foreground foreshortening and meaningful gesture, not a collage of comic panels or left/right halves.',
    material: 'Original American graphic-novel ink language, bold variable-width contours, controlled screen tones, flat layered spot colors and dramatic hand-drawn shadow. Clear physical storytelling and expressive anatomy.',
    avoid: 'Licensed heroes, copied comic panels, logos, fake dialogue, invented onomatopoeia, speech-balloon clutter or pop-art object wallpaper.'
  },
  {
    id: 'style-pixel', name: '像素游戏风', en: 'Pixel art', description: '像素字、有限色板与细致小场景，带有清晰的复古游戏质感', descriptionEn: 'Bitmap-style title, a limited palette and a carefully built pixel scene', sheet: 'drawn', cell: 4,
    type: 'Readable square bitmap-style Chinese lettering built from crisp stepped strokes. Respect each character anatomy; place the complete title on a quiet contrasting part of the scene. No smoothed modern sans overlay.',
    layout: 'A coherent low-resolution game-like scene with intentional pixel clusters, a clearly staged article subject and a quiet lower or upper strip for the title. Subject scale and pixel rhythm drive the page; no HUD or simulated application frame.',
    material: 'Genuine pixel art, limited approximately 16-color palette, crisp nearest-neighbor edges, controlled dithering, small deliberate highlights and no anti-aliased curves. Environment and mood come from the article, not a default bedroom.',
    avoid: 'Game screenshots, copied sprites, scores, buttons, life bars, invented statistics, blurry pixel filters or glossy 3D objects.'
  },
  {
    id: 'style-clay', name: '黏土定格风', en: 'Clay stop-motion', description: '圆润黏土字、指纹肌理与微缩布景，温暖且富有触感', descriptionEn: 'Rounded clay lettering, fingerprints and a tactile miniature set', sheet: 'drawn', cell: 5,
    type: 'The exact Chinese title is formed from rounded physical colored-clay letterforms with intact counters and clean readable strokes. Letters have the same lighting and material as the set, not flat printed typography.',
    layout: 'Build one coherent handcrafted miniature set with clear physical scale and a reserved wall, floor or sky plane carrying the title objects. Camera framing and a meaningful action create the hierarchy. No separate flat title card or default centered toy on a blank plinth.',
    material: 'Handmade plasticine stop-motion craft, soft rounded shapes, subtle fingerprints, small clay seams, believable studio lighting and selective depth of field. Matte colored clay, original article-specific props and expressive physical detail.',
    avoid: 'Licensed animation characters, glossy plastic toys, perfect corporate 3D blobs, unreadable sculptural letters, toy packaging or extra labels.'
  },
  {
    id: 'style-glass', name: '玻璃折射风', en: 'Refractive glass', description: '透明材质、真实焦散与细线字，让光线成为设计的一部分', descriptionEn: 'Transparent depth, convincing caustics and precise light typography', sheet: 'material', cell: 0,
    type: 'Fine architectural Chinese sans with disciplined generous spacing and strong dark-on-light contrast. A low, calm complete title grounds the luminous object scene. No chrome lettering or huge black title slab.',
    layout: 'Arrange one or very few article-specific transparent forms so refraction, cast caustics and overlapping optical planes guide the eye across an open field. Typography follows a quiet baseline, often low. Preserve material clarity rather than a generic pastel product card.',
    material: 'Physically convincing optical glass, clear and faintly tinted depth, edge refraction, spectral caustics, subtle imperfections and soft cool studio light on a matte ground. Transparency must read as glass, not polished metal or plastic.',
    avoid: 'Random glass blobs, fake product labels, chrome title objects, neon gaming palettes, excessive rainbow gradients or corporate UI mockups.'
  },
  {
    id: 'style-patchwork', name: '织物拼布风', en: 'Woven patchwork', description: '棉麻拼接、毛边与布片字，让整张封面像一件织物作品', descriptionEn: 'Woven linen patches, frayed seams and cut-fabric title characters', sheet: 'material', cell: 1,
    type: 'Solid high-contrast Chinese characters cut from physical fabric with clearly intact counters. A cloth band may run through the scene; text shares the woven material and real shadows, never a flat digital label.',
    layout: 'The whole scene is assembled from large asymmetric sewn fabric patches. Seams, patch direction and a central or offset title band establish rhythm. Avoid separate photograph cards, paper tearing or a plain heading next to a textile swatch.',
    material: 'Coarse woven linen and cotton, visible warp and weft, frayed edges, intentional stitch seams, shallow soft relief and warm tactile light. Natural flax with indigo and ochre or a restrained article-specific dye palette.',
    avoid: 'Copied commercial fabric prints, fake fashion labels, extra stitched slogans, paper collage, plastic felt surfaces or photographic room elements.'
  },
  {
    id: 'style-felt', name: '毛毡刺绣风', en: 'Felt embroidery', description: '蓬松羊毛、凸起绣线与柔软字形，细节温柔而立体', descriptionEn: 'Soft wool relief, raised thread and tactile embroidered lettering', sheet: 'material', cell: 2,
    type: 'Clean legible Chinese characters made with continuous chain-stitch embroidery or a coherent thick thread technique. Round soft edges and carefully spaced strokes, all following the fabric lighting.',
    layout: 'A soft felt subject grows diagonally across the cloth, leaving a quiet fabric region for the stitched title. Use small raised layers and intimate macro craft scale. Do not organize the image into a woven patchwork grid or a photograph/text split.',
    material: 'Fluffy wool felt, visible fiber fuzz, embroidered thread loops, tiny intentional stitches and rounded padded forms on a warm neutral cloth ground. Gentle dimensional shadows and cozy restrained color, original article-specific shapes.',
    avoid: 'Fabricated handmade brand labels, copied embroidery patterns, sharp woven seams everywhere, glossy toy plastic, signatures or illegible tangled title threads.'
  },
  {
    id: 'style-stained-glass', name: '彩窗镶嵌风', en: 'Stained-glass mosaic', description: '宝石色透光玻璃、铅线分割与中央字区，浓郁而有秩序', descriptionEn: 'Jewel-colored glass, dark lead contours and a luminous central title field', sheet: 'material', cell: 3,
    type: 'Warm ivory Chinese serif with clear intact strokes, contained within one deliberately calm central oval or other scene-appropriate glass opening. Avoid black heavy sans unrelated to the mosaic.',
    layout: 'An article-specific subject becomes a coherent luminous mosaic organized around a central quiet title field. Lead lines and colored panes create a radial or architectural rhythm. Keep word shapes separate from busy joints and avoid tiny decorative panes behind text.',
    material: 'Handmade leaded stained glass, glowing cobalt, amber and ruby or a coherent jewel palette, dark lead channels, imperfect rippled translucent panes and believable transmitted light. This is material craft, not a vector kaleidoscope.',
    avoid: 'Copied church windows, religious inscriptions, fake Latin, brand crests, uncontrolled kaleidoscopes, extra text or glossy opaque enamel.'
  },
  {
    id: 'style-blueprint', name: '工业蓝图风', en: 'Industrial blueprint', description: '轴测线稿、细密网格与技术字，像一张经过设计的工程图纸', descriptionEn: 'Axonometric linework, subtle drafting grids and technical lettering', sheet: 'material', cell: 4,
    type: 'Clean technical monospaced-feeling Chinese lettering, regular stroke and exact alignment. Use a compact full headline near a clear drafting margin and a thin rule; no invented numbers or tiny labels.',
    layout: 'One coherent axonometric or plan-like interpretation of the article subject fills the main field, with faint construction arcs and intentional unmarked diagram space. A marginal headline follows the drafting logic. Recompose the drawing for the chosen dimensions rather than fixing an object on the right.',
    material: 'Precise white engineering linework on matte deep blueprint-blue drafting paper, fine grid, varying line weights and carefully resolved joints. No photographic shadows; drawing logic must be internally plausible without pretending it is a validated technical specification.',
    avoid: 'Fabricated measurements, component labels, pseudo-data, fake engineering certifications, UI dashboards or photorealistic 3D shading.'
  },
  {
    id: 'style-surreal', name: '超现实摄影风', en: 'Surreal photography', description: '真实摄影质感与一个不可能的空间关系，让画面承载隐喻', descriptionEn: 'Photographic material realism with one impossible spatial relationship', sheet: 'material', cell: 5,
    type: 'Sober contemporary Chinese sans, moderate weight and very clear contrast, composed in a naturally quiet part of the photographic scene. Keep the headline subordinate enough that the visual paradox remains visible.',
    layout: 'Choose one impossible but meaningful article-specific relation: a threshold opening into an unexpected scale, a physically coherent levitation or an altered spatial connection. Stage it as one continuous photograph. Typography occupies available negative space rather than a default half-page title panel.',
    material: 'Exquisite editorial photographic realism, consistent lens perspective, physically coherent shadows, plausible stone, fabric or skin and restrained atmospheric color. One controlled surreal impossibility gives the image its argument; all other details remain convincing.',
    avoid: 'Copied famous surrealist imagery, fantasy illustration, collage seams, spiraling galaxies, extra fantastical motifs, fake documentary evidence or meaningless floating objects.'
  }
];

const COMMON = '从当前文章提炼真实有依据的主体、观点和关系。一次构思一张完整封面，不能拼成多个方案。视觉风格由字体、构图、材质和图像语言共同决定；换色或替换物件不算完成风格转换。预览的标题、场景和物件只供展示，不能自动带入。不得编造事实、数字、引语、个人经历或副标题。用户画幅、补充要求和文字开关优先。';
const STYLE_MESSAGES = Object.fromEntries(STYLES.flatMap(style => [[style.name, style.en], [style.description, style.descriptionEn]]));
const STYLE_TEMPLATES = STYLES.map(style => ({
  id: style.id, name: style.name, description: style.description,
  coverReady: true, titleTreatment: 'adaptive', coverPreviewKind: 'generated-style-sample',
  coverPreviewSheet: { key: style.sheet, cell: style.cell },
  styleProfile: { typography: style.type, composition: style.layout, material: style.material },
  planningPrompt: COMMON + '\nTypography: ' + style.type + '\nComposition: ' + style.layout + '\nMedium: ' + style.material + '\nAvoid: ' + style.avoid + '\n按当前文章重新选择具体场景，说明字体、空间与材质怎样共同实现本风格。用英文给出当前这一张的可执行画面描述；仅在要求文字时使用用户完整标题。',
  imagePrompt: 'Create one original finished article cover.\nCreative brief: {concept}\nTypography: ' + style.type + '\nComposition: ' + style.layout + '\nMedium and visual language: ' + style.material + '\nAvoid: ' + style.avoid + '\nCanvas: {width} x {height} px, aspect ratio {ratio}. Recompose the whole scene for this canvas; keep complete title characters and critical subjects inside at least 6 percent safe margins.\n{text_rule}\nThe text rule above takes absolute priority: with no text requested, remove ALL lettering, numerals, title panels and typographic ornaments, retaining this medium and an article-specific image. Never reproduce a preview headline or its sample subject. No unsupported facts, copied artwork, watermark, contact sheets or multi-cover layouts.',
  figurePlanningPrompt: COMMON + '\n当前任务是正文配图。保留以下图像材质与视觉语言，以当前段落的场景或关系重新构图，不带入封面标题、固定封面排版或示例主体。\n' + style.material + '\n用英文描述有助于理解段落的一处场景或关系，仅保留明确要求且有依据的短标签。',
  figurePrompt: 'Create one original article-body illustration.\nCreative brief: {concept}\nMedium and visual language: ' + style.material + '\nAvoid: ' + style.avoid + '\nUse an article-specific scene or relationship, without any cover hierarchy or fixed title area.\nCanvas: {width} x {height} px, aspect ratio {ratio}, with safe margins.\n{text_rule}\nNo cover headline, invented labels, unsupported metrics, signature, watermark or multiple separate alternatives.',
  // Legacy fallback only; both pickers prefer the available visual-style sample.
  previewSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="384" viewBox="0 0 900 384"><rect width="900" height="384" fill="#f4f1e9"/><path d="M180 260V130h180v130zm360 0V130h180v130zM389 194h121m-18-16 18 16-18 16" fill="none" stroke="#4f554e" stroke-width="4"/><text x="450" y="340" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#6e746d">SCENE STUDY / 构图示意 · 非生成效果</text></svg>',
  defaults: { textLevel: 'title' }
}));

function stylePreview(sheetRef) {
  const sheets = require('../../assets/style-previews.json').sheets;
  if (!sheetRef || !Object.hasOwn(sheets, sheetRef.key) || !Number.isInteger(sheetRef.cell) || sheetRef.cell < 0 || sheetRef.cell > 5) return '';
  const sheet = sheets[sheetRef.key];
  const [x, y, width, height] = sheet.frames[sheetRef.cell];
  // A viewBox transforms coordinates but does not clip to them. Both the frame clip
  // and matching intrinsic ratio prevent neighboring cells leaking into letterbox space.
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="' + [x, y, width, height].join(' ') + '"><defs><clipPath id="sample-frame" clipPathUnits="userSpaceOnUse"><rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '"/></clipPath></defs><image clip-path="url(#sample-frame)" x="0" y="0" width="' + sheet.width + '" height="' + sheet.height + '" href="' + sheet.image + '"/></svg>';
}

module.exports = { STYLE_TEMPLATES, STYLE_MESSAGES, SAMPLE_TITLE, stylePreview };

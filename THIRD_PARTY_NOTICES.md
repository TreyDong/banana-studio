# Third-party notices

## Qiaomu Design

Banana Design contains adaptations of the local Codex app-server bridge and provider preset data from [joeseesun/qiaomu-cover-design](https://github.com/joeseesun/qiaomu-cover-design), version 0.3.0. Its service-management and settings interaction informed this implementation. The reference checkout is read-only and is not the Banana Design source repository. The upstream material is MIT licensed; its complete notice follows. Current upstream license verified on 2026-10-19, main commit 62272849f382abae54cf13d0258e8c40f53ae1df. This is not an official Qiaomu product. Credit: 向阳乔木 (joeseesun), adapted upstream portions.

MIT License

Copyright (c) 2025-2026 向阳乔木 (joeseesun)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Preview assets and templates

`assets/neon-card.svg` is the original geometric layout preview supplied with Banana Design. `assets/dan-koe.png` is the AI-generated, untitled generic landscape preview supplied with Banana Design; it contains no article material and is not a work by Dan Koe. The template name describes a visual reference, not authorship or endorsement. Custom user templates, reference photos and generated article images are not bundled.

Both previews are embedded at build time. There are no bundled third-party fonts or runtime font downloads; the local Canvas renderer uses system fonts. Template prompts and `src/rendering/cover-layout.js` are authored for this plugin. Referenced external projects are design research references, not additional bundled dependencies.

## Host and tools

Obsidian supplies its API and Lucide icon rendering; Obsidian is not redistributed. Codex CLI is a user-installed external dependency and is not installed, updated or distributed by this plugin. esbuild is an MIT-licensed build-time dependency, pinned by package-lock.json; its runtime is not included in the plugin. No Fabric, React, Qiaomu templates, private account configuration, or external service SDK is bundled.

The Qiaomu notice above is also prepended verbatim to the distributed main.js so the standard three-file installer preserves it.

## Awesome GPT Image template research

The initial article-led recipes in `src/templates/catalog.js` use the category structures and production constraints documented by freestylefly in [awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2/blob/63e6176fa01be51c000108dacd72716d3e46784b/docs/templates.md), inspected 2026-10-19. The repository is MIT licensed; its notice follows. The recipes were rewritten for article evidence, independent output ratios and separate cover/body rules. Article-body previews are original geometric layout studies; seven cover directions use original AI-generated samples. The four newer editorial directions have independently written rules informed by publication-design references listed below. No upstream community image, publication cover, logo, real-person photograph or verbatim third-party case prompt is redistributed. The source repository separately disclaims ownership of third-party community cases; its MIT does not establish rights to those third-party works.

Editorial design references inspected during the 2026-10-20 template work include [The New Yorker / Time for Reflection](https://www.newyorker.com/culture/cover-story/cover-story-2022-07-25), Pentagram's [The Baffler](https://www.pentagram.com/work/the-baffler), [Tablet Magazine](https://www.pentagram.com/work/tablet-magazine) and [The Paris Review](https://www.pentagram.com/work/the-paris-review), [Kinfolk's magazine catalog](https://www.kinfolk.com/product-category/kinfolk-magazines/), and [Alex Hunting Studio](https://alexhunting.studio/pages/about). [AttentionVC's AI article list](https://www.attentionvc.ai/article?category=ai&lang=en%2Czh) supplied additional composition and typography research; displayed article views do not establish that a cover caused its popularity. These are visual-method references, not bundled artwork or endorsements. The current reusable rules and per-template source links are in `src/templates/catalog.js`; the original generated cover previews and comparison studies are in `assets/`.

MIT License

Copyright (c) 2026 freestylefly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Thirty-cover research expansion — 2026-10-20

The fourteen new directions in `src/templates/researched.js` and their SVG typography examples are independently authored. Public projects and template websites were inspected for visual methods, not imported as code or artwork. No repository case prompt is reproduced verbatim, and no community image, website template file, stock photo, font, publication identity or branded finished design is bundled. The article-specific planning, typography, text-free and dimension rules were rewritten for Banana Design. This is not an endorsed integration with any reference service.

The checked GitHub repository snapshots are recorded in `assets/template-research.json`:

| Research project | Stars checked | Repository license | Inspected method |
| --- | ---: | --- | --- |
| freestylefly/awesome-gpt-image-2 | 34,747 | MIT, full notice retained above | Poster hierarchy, action, ink double exposure, subject and whitespace |
| op7418/guizang-ppt-skill | 28,264 | AGPL-3.0 | Editorial hierarchy and cover proportions; no code, theme or asset incorporated |
| PicoTrex/Awesome-Nano-Banana-images | 23,914 | Apache-2.0 | Collage and coherent scene construction; no code, prompt text or community artwork incorporated |
| YouMind-OpenLab/awesome-nano-banana-pro-prompts | 13,637 | CC-BY-4.0 | Travel editorial, typography and ink-zine categories; no verbatim case prompt or image incorporated |
| ZeroLu/awesome-nanobanana-pro | 10,357 | MIT | Portrait, photo-book, diorama, magazine and scrapbook categories; no verbatim case prompt or image incorporated |
| ikuaitu/vue-fabric-editor | 7,999 | MIT | Editor/template workflow research; no runtime dependency or paid-template inventory incorporated |
| dromara/yft-design | 1,664 | MIT | Canvas editor research; no runtime dependency or template artwork incorporated |

The previously retained MIT notice covers the existing adapted freestylefly template research. Repository licenses do not establish rights to every linked third-party community work. YouMind OpenLab's collection is copyright (c) 2025 YouMind OpenLab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); original case creators relevant to the research include lovimg_com (travel editorial), Gadgetify (typographic emergence) and Zayan (ink zine). PicoTrex credits tetumemo for its fashion collage case. ZeroLu credits NanoBanana for its magazine portrait and 歸藏 / op7418 for its narrative diorama. These credits identify the inspected public sources; Banana Design's new examples and rules change the topic, composition, typography, ratios and article-evidence behavior and contain none of those creators' images or literal prompt passages.

Website research covered [Canva blog graphics](https://www.canva.com/blog-graphics/templates/), [Kittl posters](https://www.kittl.com/templates/posters) and its Bauhaus, brutalist and art-show categories, [Fotor blog banners](https://www.fotor.com/blog-banner/templates/), [Adobe Express banners](https://www.adobe.com/express/templates/banner), and [Playground vintage posters](https://playgroundai.com/templates/s/vintage-poster). These sites' proprietary assets remain with their respective owners. Source links are references, not permission to redistribute their templates. Gaoding and Chuangkit public category descriptions were also screened; unavailable live galleries were not used as evidence for any unseen design. Specific inspection limits are recorded in the research JSON. Star counts are dated repository snapshots, not per-template ratings, usage or performance claims.

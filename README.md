# Banana Design

Create article-led covers and illustrations in Obsidian desktop. Choose an article, a visual template, and independent planning and image services. Preview results, export PNGs, and insert illustrations at approved locations.

**Desktop only · Obsidian 1.11.4 or later · Version 0.10.2**

## Use

1. Enable the plugin and run **Open illustration workspace** (`banana-design:open`, displayed in Chinese as 打开配图工作台), or select its ribbon icon.
2. Select a Markdown article. Choose a format and a template, including the built-in blank, engraving-inspired, and local card layouts. Dimensions and visual style are independent.
3. For a cover, enter the request and choose 1–4 candidates. Generated images are saved as new files; old results remain in history.
4. For article illustrations, generate a plan, review or edit the complete batch, then confirm generation. Owned markers reserve the chosen paragraphs; batch insertion replaces only valid markers. Missing or ambiguous targets stop insertion and never silently append images.
5. Export the selected PNG, insert a cover, or return to an earlier batch. Restarting the workspace clears the current view while retaining saved images and history.

The interface supports Simplified Chinese and English. In **Settings → Banana Design → Interface language**, choose **Follow Obsidian**, **简体中文** or **English**. The selection is saved and refreshes the workspace immediately. Automatic mode follows Obsidian's language; other host languages use English. Articles, titles, prompts, custom template names, service names and existing history retain their original wording. The language setting controls the interface; it does not request translation of article or image content.

The plugin does not replace the Markdown editor or provide a general autonomous agent. Local card layouts export a flattened PNG; generated image edits use an entire reference image, without a layer or mask editor.

## Models and connections

In plugin settings, configure **Planning** and **Image generation** independently. Use an already installed and signed-in Codex CLI, or add your own API connection. Available API formats include OpenAI Chat Completions, Responses, Anthropic Messages, OpenAI-compatible Images, Gemini native images, Seedream and OpenRouter images. Presets are editable endpoint suggestions; they do not establish that an account has model access. A fetched model list is not an entitlement guarantee.

New installations default to Codex CLI connections; enabling the plugin does not start a model call or install a CLI. Model discovery runs only when requested. The user must install and authenticate external tools separately. API credentials use Obsidian SecretStorage; plugin data stores secret references rather than key values. HTTPS is required for remote endpoints; loopback HTTP is supported for local services.

## Accounts, payment, network and privacy

- The plugin itself is MIT licensed and has no payment gate, ads, author-operated service, or client-side telemetry. AI features require an external provider account, API credentials or a signed-in CLI; that service may charge for usage. Local card rendering is local, while AI-assisted card copy still uses the planning model.
- Explicit model requests send the selected article text, instructions and necessary context to the chosen planning service. Image generation sends the design prompt and selected reference images to the chosen image service. Generated-image URLs returned by that service are downloaded. Refreshing models requests the selected service's model list. No background scan sends the whole vault.
- Presets include OpenAI, Anthropic, Google, OpenRouter, SiliconFlow, DeepSeek, Moonshot/Kimi, Zhipu, MiniMax, Alibaba Cloud, Volcengine/Seedream and other configurable API services; only the selected connection is used. Ollama and loopback-compatible local services are supported. No article data goes to Qiaomu or Dan Koe. Provider retention and billing are governed by that provider's terms; this plugin has no independent server-side data store.
- Codex runs as a local subprocess over stdio and uses its existing authentication and provider configuration. The plugin checks common executable locations, the user-specified binary and the shell command lookup. Planning uses a read-only sandbox in the system temporary directory; image generation uses a per-job temporary directory with writes restricted to it and network disabled in its execution sandbox. Inference still uses the CLI's provider network. These are CLI sandbox controls, not a guarantee that an external CLI has no additional access; review the CLI configuration you choose to use.
- Image output files are read only from the job directory or the CLI's `~/.codex/generated_images` directory, after resolving symlinks and checking image signatures and size. Job directories are removed after completion. The CLI may retain its own authentication, logs or generated-image cache outside the vault.
- Article paths, prompts, conversation, history, custom templates and session snapshots remain in `<vault>/.obsidian/plugins/banana-design/data.json`. Generated PNGs stay in the configured vault folder. Syncing these locations may also sync their private content. None is part of the source repository or Release.
- Export uses a temporary in-memory download URL. System fonts are used for Canvas rendering; bundled preview images are embedded offline and do not cause CDN requests.

## Files and compatibility

The default output folder is `Banana Design` inside the vault. Settings support article, date and task variables and preview the resulting path. Existing names are never silently overwritten; new versions receive a suffix. Generated assets and source notes stay separate.

The plugin ID remains `banana-design`, the command remains `open`, and the settings schema and SecretStorage references are preserved. For an existing installation, retain `data.json` and existing image folders when updating. The 0.10.1 publication build bundles the previous sibling modules and preview assets into `main.js`; no migration of user data is required. Old extra files may remain harmlessly in a manually installed folder.

## Install

Open the official [Obsidian Community listing](https://community.obsidian.md/plugins/banana-design) and choose **Add to Obsidian**. The initial 0.10.1 publication completed automated review on 2026-10-19 with **Health: Excellent** and **Review: Satisfactory**, including a byte-for-byte reproduced build. Those results describe 0.10.1; consult the listing for the current version's review status. GitHub Releases and marketplace review may update at different times.

The expanded plugin bundle exceeds 5 MB. Obsidian Sync Standard cannot sync files larger than 5 MB, so install the plugin separately on each desktop if you use that plan. The release embeds the offline template previews in the standard three-file package.

For a manual install, download **main.js**, **manifest.json** and **styles.css** from the matching [GitHub Release](https://github.com/TreyDong/banana-design/releases) and place them in `<vault>/.obsidian/plugins/banana-design/`. Enable Banana Design in Community plugins. Do not copy source folders or any other person's `data.json` into the vault.

## Build and check

Requires Node.js 20 or later and npm.

```sh
npm ci
npm run check
```

The project separates source modules, build tooling, tests and preview assets:

```text
src/
  main.js                      Plugin entry, workspace and settings
  i18n.js                      Chinese / English interface messages
  services/model-services.js   Model connections and provider protocols
  illustrations/figure-agent.js Article planning, anchors and insertion
  rendering/cover-layout.js    Local cover rendering
  templates/catalog.js         Cover and illustration recipes
scripts/build.mjs              Bundle and embed previews and notices
tests/release.test.cjs          Release and behavior regression tests
assets/                        Offline preview images and type studies
manifest.json                  Obsidian plugin metadata
versions.json                  Version compatibility
styles.css                     Plugin styles
```

`npm run build` runs `scripts/build.mjs` to create an unminified CommonJS `main.js` in the project root, embeds previews and third-party notices, and leaves Obsidian as a host dependency. Upload `main.js`, `manifest.json`, and `styles.css` as Release assets under a tag exactly matching the manifest version, without a `v` prefix. Compiled output and `node_modules` are excluded from source Git.

Tests cover standalone three-file installation, migration, source/marker ownership, no append fallback, path traversal and symlink rejection, local API context, cancellation and key redaction. Mock tests do not certify access to every provider or platform. Publication checks used synthetic fixtures on Obsidian 1.14.4 for macOS; they do not establish Windows/Linux or minimum-version compatibility, or access to paid providers.

## License and credits

[MIT](LICENSE), with original upstream attribution retained. Banana Design includes adapted Codex bridge and provider preset portions from [Qiaomu Design](https://github.com/joeseesun/qiaomu-cover-design) by 向阳乔木 (joeseesun). Full upstream MIT terms and the precise adaptation scope are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and embedded in the distributed plugin. Local article illustration planning, anchor and layout modules were authored for Banana Design.

The engraving template is a style reference; its AI-generated generic preview is not Dan Koe's artwork and implies no endorsement. Custom user assets are not bundled. This is an independent community plugin, not an official Obsidian, Qiaomu, OpenAI or Dan Koe product.

## Template catalog

The catalog includes 38 templates, with 30 cover choices and 38 illustration styles. They cover conceptual typography, paper, watercolor, diagrams, cinematic scenes, lifestyle photography, ink, still life, human narrative, opinion collage and literary painting. Covers and body illustrations have separate prompts, independent dimensions and saved custom overrides. The source link appears in the template library when selected. Body previews are labeled **layout studies**; the seven sampled cover directions use actual generated-cover previews.

The original category recipes are informed by a popular GPT Image repository's documented categories and production rules. The four newer editorial directions use independently written rules informed by real publication-design references. Repository stars and article views are not per-template use counts or proof of a cover's causal effect. No runtime reference-site request or fixed image provider is added. See [template sources and attribution](THIRD_PARTY_NOTICES.md#awesome-gpt-image-template-research) and the source links in [the catalog](src/templates/catalog.js). The initial category expansion shipped in version 0.10.2; the thirty-cover expansion below is currently unreleased.

## Changes

### Unreleased

- Expanded the default cover library to **30 choices** (38 illustration styles) after inspecting seven GitHub projects and the Canva, Kittl, Fotor, Adobe Express and Playground template collections. Fourteen new directions have independently written prompts, different sample titles, original offline SVG examples and per-template reference links. Sources, checked star counts, licenses, inspection limits and selection reasons are recorded in [template-research.json](assets/template-research.json).

- Expanded covers from 10 to 16 choices with six original typography directions: resource list, Swiss grid, magazine headline, vintage newsprint, duotone screenprint and archive papers. Each uses a distinct fictional sample title and is labeled **Typography example**, separate from the seven generated-image previews. Runtime prompts use the selected article, never the sample copy or numbers.
- Replaced the current-template dropdown at the bottom with a searchable management list. Edit names, descriptions and prompts; create or copy templates; hide/show styles; reset built-in edits; delete and restore custom templates. Hidden active templates remain usable, and the blank template stays first. Management edits preserve the active selection.
- Fixed long Chinese and English descriptions wrapping inside cards, kept search and management controls visible above the scrolling grid, and added save-failure rollback for template preferences.


### 0.10.2 — 2026-10-20

- Added an interface language setting with automatic, Simplified Chinese and English modes, including settings help, workspace controls, template descriptions, model dialogs and authored status/error messages.
- Language changes persist and refresh the workspace. User-authored content, template instructions, saved image names and paths retain their original wording. Language changes are disabled during active generation or insertion.
- Added article-led visual recipes with seven original generated-cover previews, including human narrative, opinion collage, quiet lifestyle photography and literary painting; refined headline weight, emphasis and alignment.
- Kept explanatory diagrams in the illustration library while preserving active selections and saved custom templates. Simplified provider cards to names and aligned marks.
- Validation: all 15 regression checks pass, including saved language choices, automatic host-language selection, save-failure rollback, custom template text and unchanged generation prompts/output paths. Native Obsidian 1.14.4 checks covered Chinese/English settings, model forms, workspace tabs and template descriptions, plus persistence across plugin reload.

### Source organization — 2026-10-20

- Grouped model services, article illustrations, local rendering and templates under their respective `src/` directories; moved build tooling into `scripts/` and updated imports and tests.
- Removed the engineering process directory at the author's request. Source references and full license notices remain in `THIRD_PARTY_NOTICES.md`; earlier process records remain available in Git history at commit `0b45996e61c8115230a51abf7c9d78096b06dbc3`.
- This is a source organization change. The three-file installation format, version, plugin behavior and user data schema are unchanged.

### 0.10.1

- Added a reproducible standard three-file release with embedded modules, previews and third-party notices.
- Restricted remote APIs to HTTPS and limited agent-provided image paths to validated output directories.
- Fixed template dialogs overwriting Obsidian's internal keyboard scope.
- Removed routine startup logging and preserved existing IDs, settings, history and output paths.
- Created a clean source repository from the user-confirmed readable vault modules; excluded private data and local backups.

## Cover samples and illustration recipes

The cover library includes the existing blank, engraving and neon layouts plus seven generated-cover directions: conceptual paper typography, cinematic spatial storytelling, tactile metaphorical still life, human narrative, opinion collage, quiet lifestyle photography and literary painting. Their offline previews are actual generated covers using distinct demonstration topics suited to each style. These fictional examples show possible applications; they are not user articles or fixed prompts for later covers. Each selected article supplies its own title, subject and scene. The four newer directions also support title-free images; the selected text rule takes priority over typography guidance.

| Direction | Demonstration title | Intended example |
| --- | --- | --- |
| Conceptual paper typography | 审美不够，怎么用 AI 做出更有质感的产品？ | Product and design |
| Cinematic storytelling | 换一条路，重新出发 | Change and personal choices |
| Tactile still life | 买得更少，用得更久 | Thoughtful consumption and repair |
| Human narrative | 下班以后，生活才刚刚开始 | Everyday experience beyond work |
| Opinion collage | 信息越多，判断越难？ | Commentary and information judgment |
| Lifestyle photography | 把周末，还给真实的生活 | Daily life and weekend observation |
| Literary painting | 在不确定里，慢慢向前 | Personal essays and reflection |

The preview correction replaces six comparison images from 0.10.2, retaining one product/design example and the established typography direction. Original generation briefs and reference versions are recorded in [preview-samples.json](assets/preview-samples.json). It changes demonstration images, not runtime template instructions or user content.

Process, comparison, scale and other diagram recipes remain available in the article-illustration library. Existing active choices and saved user customizations remain accessible. A sample demonstrates one generated result, not a guarantee that every model produces an identical image. Current reusable prompts are in [the catalog](src/templates/catalog.js), with offline samples in `assets/` and regression coverage in `tests/`.


## Thirty cover directions

The cover library now has **30 selectable templates**; the eight body-only diagrams are excluded from that count. Blank stays first. The following fourteen additions build on the existing sixteen covers. These are reusable visual systems, with independent cover and body prompts, rather than fixed article titles or palette-only variants.

| New direction | Demonstration title | Method reference |
| --- | --- | --- |
| Split photograph | 普通人的一天 | Canva blog graphics; Fotor banners |
| Cutout portrait | 找到自己的声音 | ZeroLu magazine portrait; Canva |
| Monochrome frame | 城市很大，也需要自己的角落 | Fotor black-and-white blog covers |
| Film sequence | 带着好奇心，去一座陌生的城市 | YouMind travel editorial; Fotor |
| Torn-paper journal | 把零碎日常，拼成自己的生活 | PicoTrex collage; YouMind |
| Bauhaus | 让灵感，有地方发生 | Kittl Bauhaus posters |
| Brutalist type | 别等完美，先开始 | Kittl brutalist posters |
| Vintage travel | 沿着山路，找回周末 | Playground vintage posters |
| Cyanotype | 观察一片叶子，重新认识自然 | Original contact-print direction extending GPT Image subject/whitespace research |
| Ink double exposure | 山水之间，看见另一种生活 | GPT Image ink double-exposure category |
| Miniature scene | 小小书店，装得下一个世界 | ZeroLu narrative diorama category |
| Matte gradient | 工具在变，创造力走向哪里 | Adobe Express banner hierarchy |
| Motion moment | 迈出第一步，比准备更重要 | GPT Image sports campaign category |
| Exhibition catalog | 换个角度，重新看一件作品 | Kittl art-show posters; editorial hierarchy research |

The new offline previews are explicitly labeled **Typography example**. They show composition and headline hierarchy; they are not copied website templates, third-party photographs or proof that an image model reproduced the sample. The selected article supplies the actual subject, exact title and supported facts. A verified number is required before a numeric cover can emphasize it, and title-free output takes precedence over every style rule. No website login, runtime reference-site fetch, bundled editor dependency or font download was added.

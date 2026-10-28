# Banana Design

Create article-led covers and illustrations in [Obsidian](https://obsidian.md/) desktop. Choose an article, a visual template, and independent planning and image services. Preview results, export PNGs, and insert illustrations at approved locations.

**Desktop only · Obsidian 1.11.4 or later**

## Features

- **Cover and body illustrations** from the current Markdown note, with separate formats, templates, dimensions, and visual styles
- **Planning and image services configured independently** — Codex CLI or your own API connections (OpenAI, Anthropic, Gemini, OpenRouter, Seedream, and other OpenAI-compatible endpoints; Ollama and local loopback services also work)
- **Canvas text planned from the article**, with inline editing before generation; **region edit** to change only a marked area of a generated cover
- **Article illustration planning** with owned paragraph markers; insertion never silently appends images
- **WeChat Official Account** rich-text preview and draft publishing for verified accounts, including an optional fixed-IP SSH relay
- **X (Twitter) thread publishing** with AI rewrite or deterministic splitting, OAuth 1.0a or OAuth 2.0, and optional proxy / SSH relay
- Interface language follows Obsidian (Simplified Chinese or English)

## Installation

Install from the [Obsidian Community plugins listing](https://community.obsidian.md/plugins/banana-design), or download `main.js`, `manifest.json`, and `styles.css` from the matching [GitHub Release](https://github.com/TreyDong/banana-design/releases) into `<vault>/.obsidian/plugins/banana-design/` and enable the plugin.

The release package is larger than 5 MB, so Obsidian Sync Standard cannot sync it; install the plugin separately on each desktop if you use that plan.

## Getting started

1. Enable the plugin and run **Open illustration workspace** (`banana-design:open`), or use the ribbon icon.
2. Open a Markdown note (or click the ribbon while a note is active). The workspace has two stages: **Create images** (Cover / Body illustrations) and **Preview & publish** (Original article / WeChat / X).
3. Choose a format and template, enter a request, and generate candidates. Reference images can be picked from disk or the vault.
4. Export a PNG, insert a cover, or confirm a planned illustration batch. Restarting the workspace clears the current view; saved images and history remain.

API credentials and publishing secrets use Obsidian SecretStorage. The plugin does not replace the Markdown editor or act as a general autonomous agent.

## Models and connections

Configure **Planning** and **Image generation** separately in settings. New installs default to Codex CLI connections; the plugin does not start model calls or install a CLI on enable. Model discovery runs only when requested. Presets are endpoint suggestions, not proof of account access. Remote endpoints require HTTPS; loopback HTTP is allowed for local services.

## Privacy

- The plugin is MIT licensed, with no payment gate, ads, author-operated service, or client-side telemetry. AI usage is billed by the provider you configure.
- Only explicit requests send article text, prompts, or reference images to the chosen planning or image service. The vault is not scanned in the background.
- Session data lives in `<vault>/.obsidian/plugins/banana-design/data.json`; generated PNGs stay in the configured vault folder. Syncing those locations may sync private content.
- This is an independent community plugin, not an official Obsidian, Qiaomu, OpenAI, or Dan Koe product.

## Development

Requires Node.js 20+ and npm.

```sh
npm ci
npm run check
```

`npm run build` creates an unminified CommonJS `main.js` in the project root. Release assets are `main.js`, `manifest.json`, and `styles.css` under a tag that matches the manifest version (no `v` prefix).

For changes in each release, see the [GitHub Releases](https://github.com/TreyDong/banana-design/releases) page.

## License

[MIT](LICENSE). Adapted Codex bridge and provider preset portions come from [Qiaomu Design](https://github.com/joeseesun/qiaomu-cover-design) by Xiangyang Qiaomu (joeseesun); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

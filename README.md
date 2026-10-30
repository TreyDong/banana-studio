# Banana Studio

Create covers and illustrations from Markdown articles in [Obsidian](https://obsidian.md/) desktop, preview platform versions, and publish to WeChat Official Account or X.

**Desktop only · Obsidian 1.11.4 or later**

Banana Studio is developed in its own repository, starting from [Banana Design](https://github.com/TreyDong/banana-design) commit `ce8aa777ed432b33b168068f922b620df813402f`. The existing Git history, license, and third-party notices are retained.

## Features

- **Cover and body illustrations** from the current Markdown note, with separate formats, templates, dimensions, and visual styles
- **Planning and image services configured independently** — Codex CLI or your own API connections (OpenAI, Anthropic, Gemini, OpenRouter, Seedream, and other OpenAI-compatible endpoints; Ollama and local loopback services also work)
- **Canvas text planned from the article**, with inline editing before generation; **region edit** to change only a marked area of a generated cover
- **Article illustration planning** with owned paragraph markers; insertion never silently appends images
- **WeChat Official Account** rich-text preview and draft publishing for verified accounts, including an optional fixed-IP SSH relay
- **X (Twitter) thread publishing** with AI rewrite or deterministic splitting, OAuth 1.0a or OAuth 2.0, and optional proxy / SSH relay
- Interface language follows Obsidian (Simplified Chinese or English)

## Installation

Download `main.js`, `manifest.json`, and `styles.css` from the matching [GitHub Release](https://github.com/TreyDong/banana-studio/releases), copy them into `<vault>/.obsidian/plugins/banana-studio/`, and enable the plugin. You can also install `TreyDong/banana-studio` with [BRAT](https://github.com/TfTHacker/obsidian42-brat). Community directory submission is in preparation; manual installation and BRAT are available independently of directory approval.

The release package is larger than 5 MB, so Obsidian Sync Standard cannot sync it; install the plugin separately on each desktop if you use that plan.

Banana Studio uses its own plugin ID (`banana-studio`), settings, and default image folder (`Banana Studio`). Existing Banana Design settings, credentials, and history are not imported automatically. Use a separate test vault for initial checks.

## Getting started

1. Enable the plugin and run **Open illustration workspace** (`banana-studio:open`), or use the ribbon icon.
2. Open a Markdown note (or click the ribbon while a note is active). The workspace has two stages: **Create images** (Cover / Body illustrations) and **Preview & publish** (Original article / WeChat / X).
3. Choose a format and template, enter a request, and generate candidates. Reference images can be picked from disk or the vault.
4. Export a PNG, insert a cover, or confirm a planned illustration batch. Restarting the workspace clears the current view; saved images and history remain.

API credentials and publishing secrets use Obsidian SecretStorage. The plugin does not replace the Markdown editor or act as a general autonomous agent.

## Models and connections

Configure **Planning** and **Image generation** separately in settings. New installs default to Codex CLI connections; the plugin does not start model calls or install a CLI on enable. Model discovery runs only when requested. Presets are endpoint suggestions, not proof of account access. Remote endpoints require HTTPS; loopback HTTP is allowed for local services.

## Privacy

- The plugin is MIT licensed, with no payment gate, ads, author-operated service, or client-side telemetry. AI usage is billed by the provider you configure.
- Only explicit requests send article text, prompts, or reference images to the chosen planning or image service. The vault is not scanned in the background.
- **Accounts and network use:** AI generation requires an authenticated Codex CLI or access to your configured AI provider; account access and usage costs depend on that provider. Explicit generation requests send article text, prompts, or selected reference images to that service. WeChat and X publishing require the corresponding platform account and developer credentials, and send the selected content and images to that platform. Optional proxies and SSH relays connect only to servers you configure. Browser-based draft delivery uploads the article snapshot and images to your paired publishing relay and browser. There is no author-operated backend.
- **Files outside the vault:** the optional Codex integration finds and starts your local CLI, uses an operating-system temporary job directory, and reads generated images only from that job directory or `~/.codex/generated_images`. The CLI uses its own existing sign-in. Local reference images are read only when selected; an optional SSH private-key file is read only from the path you configure.
- Session data lives in `<vault>/.obsidian/plugins/banana-studio/data.json`; generated PNGs stay in the configured vault folder. Syncing those locations may sync private content.
- This is an independent community plugin, not an official Obsidian, Qiaomu, OpenAI, or Dan Koe product.

## Development

Requires Node.js 20+ and npm.

```sh
npm ci
npm run check
```

`npm run build` creates an unminified CommonJS `main.js` in the project root. The plugin files are `main.js`, `manifest.json`, and `styles.css`.

Banana Studio starts from Banana Design 0.12.1; its first independent release is `0.12.2`. Release tags must match the manifest version (no `v` prefix). Pushing a stable version tag runs the release workflow, which checks version metadata, builds and tests the plugin, then publishes those three files as individual GitHub Release assets.

Project decisions are recorded in [notes/](notes/). The initial project boundary and source are recorded in [the initialization note](notes/banana-studio-initialization-2026-10-30.md).

## License

[MIT](LICENSE). Based on Banana Design by Treydong. Adapted Codex bridge and provider preset portions come from [Qiaomu Design](https://github.com/joeseesun/qiaomu-cover-design) by Xiangyang Qiaomu (joeseesun); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

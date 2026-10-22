import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const notices = await readFile(new URL('../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');
await build({
  absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
  entryPoints: ['src/main.js'], outfile: 'main.js', bundle: true,
  platform: 'node', format: 'cjs', target: 'es2022',
  // ssh2 的可选原生加速模块（cpu-features、sshcrypto.node）不打进包；缺失时 ssh2 自动回退纯 JS 实现。
  external: ['obsidian', 'electron', 'cpu-features', '*.node'],
  loader: { '.png': 'dataurl', '.svg': 'dataurl', '.webp': 'dataurl' }, minify: false,
  banner: { js: '/*\n' + notices.replaceAll('*/', '* /') + '\n*/' },
  logLevel: 'info',
});

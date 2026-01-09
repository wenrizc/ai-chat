import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');

const options = [
  {
    entryPoints: ['background.js'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    outfile: 'dist/background.js',
    sourcemap: true
  },
  {
    entryPoints: ['chat-window.js'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    outfile: 'dist/chat-window.js',
    sourcemap: true
  }
];

if (watch) {
  for (const opt of options) {
    const ctx = await context(opt);
    await ctx.watch();
  }
  process.on('SIGINT', async () => {
    process.exit(0);
  });
} else {
  for (const opt of options) {
    await build(opt);
  }
}

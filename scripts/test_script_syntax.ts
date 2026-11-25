import * as fs from 'fs';

async function verify() {
  const m = await import('../dist/src/api/ui.js');
  const html = m.renderHtmlUI();
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error('No script tag found!');
  }
  const code = scriptMatch[1];
  fs.writeFileSync('temp_script.js', code, 'utf8');

  // Test eval in node vm
  const vm = await import('vm');
  try {
    new vm.Script(code);
    console.log('✓ Script in rendered HTML has 100% VALID SYNTAX! No runtime SyntaxError.');
  } catch (e: any) {
    console.error('SyntaxError in rendered script:', e.message);
    process.exit(1);
  }
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});

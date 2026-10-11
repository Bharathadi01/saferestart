import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const mdFiles = [
  'README.md',
  'ARCHITECTURE.md',
  'API.md',
  'AI_DISCLOSURE.md',
  'DEMO_WALKTHROUGH.md',
  'CONTRIBUTING.md',
  'docs/ARCHITECTURE.md',
  'docs/SUBMISSION_WRITEUP.md',
  'docs/TESTING.md',
  'docs/INTERVIEW_PREPARATION.md',
  'docs/KNOWN_LIMITATIONS.md',
  'docs/DEMO_SCRIPT.md',
  'docs/screenshots/README.md',
];

let errorsFound = 0;
let checkedImages = 0;
let checkedLinks = 0;

console.log('--- Validating Documentation Assets & Links ---\n');

for (const relFile of mdFiles) {
  const fullPath = path.resolve(repoRoot, relFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] File missing: ${relFile}`);
    errorsFound++;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const fileDir = path.dirname(fullPath);

  // 1. Check Images: ![alt](url) or <img src="url" />
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)|<img\s+[^>]*src=["']([^"']+)["']/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const src = imgMatch[2] || imgMatch[3];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      continue;
    }
    checkedImages++;
    // Clean query/hash if any
    const cleanSrc = src.split('#')[0].split('?')[0];
    const resolvedPath = path.resolve(fileDir, cleanSrc);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[BROKEN IMAGE] in ${relFile}: "${src}" -> resolved to ${resolvedPath}`);
      errorsFound++;
    } else {
      console.log(`[OK IMAGE] in ${relFile}: "${src}"`);
    }
  }

  // 2. Check Local File Links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const href = linkMatch[2].trim();
    // Skip external URLs, mailto, anchor-only links (#section)
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('#') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }
    checkedLinks++;
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!cleanHref) continue; // anchor only
    const resolvedPath = path.resolve(fileDir, cleanHref);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[BROKEN LINK] in ${relFile}: "${href}" -> resolved to ${resolvedPath}`);
      errorsFound++;
    }
  }
}

console.log(`\nValidation complete: Checked ${checkedImages} images and ${checkedLinks} relative links.`);
if (errorsFound > 0) {
  console.error(`[RESULT] ${errorsFound} issues found.`);
  process.exit(1);
} else {
  console.log('[RESULT] All images and local links are valid!');
}

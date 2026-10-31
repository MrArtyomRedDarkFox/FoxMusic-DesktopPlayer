const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
assert.match(css, /Stable close\/delete controls: fixed box, true glyph centering, no hover drift/);
assert.match(css, /\.queue-remove\s*\{[^}]*width:\s*24px\s*!important;[^}]*height:\s*24px\s*!important;/s);
assert.match(css, /\.queue-remove\s*>\s*span\s*\{[^}]*text-align:\s*center\s*!important;[^}]*transform:\s*none\s*!important;/s);
assert.match(css, /\.queue-remove:hover,\s*\.queue-remove:focus-visible\s*\{[^}]*transform:\s*none\s*!important;/s);
assert.match(css, /\.now-playing-close:hover\s*\{[^}]*transform:\s*none\s*!important;/s);
assert.match(css, /#clearFolderSourceBtn::before,[\s\S]*?\.queue-clear-btn::before\s*\{[^}]*transform:\s*none\s*!important;/s);
console.log('PASS: delete/close buttons keep a fixed box and centered × without hover movement');

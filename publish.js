const fs = require('node:fs');
const pack = require('./package.json');
delete pack.scripts;
delete pack.devDependencies;
fs.copyFileSync('./README.md', './dist/README.md');
fs.copyFileSync('./LICENSE', './dist/LICENSE');
fs.writeFileSync('./dist/package.json', JSON.stringify(pack, null, 2));

const fs = require('fs');
const path = require('path');

// 打包后的 index.html 路径
const indexPath = path.join(__dirname, 'dist/word-memorizer/browser/index.html');

if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    process.exit(1);
}

let indexContent = fs.readFileSync(indexPath, 'utf-8');

// 移除包含 fs-extra、path、pdf-parse 的 modulepreload 链接
indexContent = indexContent.replace(/<link rel="modulepreload" href="(fs-extra|path|pdf-parse)">/g, '');

fs.writeFileSync(indexPath, indexContent, 'utf-8');
console.log('Fixed index.html by removing invalid modulepreload links.');
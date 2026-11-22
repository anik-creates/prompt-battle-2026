import fs from 'fs';
import path from 'path';

const routes = ['submit', 'admin', 'judge', 'presentation'];
const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  const content = fs.readFileSync(indexHtmlPath, 'utf8');
  for (const r of routes) {
    const routeDir = path.join(distDir, r);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), content);
    console.log(`Generated clean route static fallback: dist/${r}/index.html`);
  }
}

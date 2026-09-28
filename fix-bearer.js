const fs = require('fs');
let controller = fs.readFileSync('src/auth/auth.controller.ts', 'utf8');

const target = `    const token = body.refreshToken || req.headers['x-refresh-token'] || req.cookies?.refresh_token;`;
const replacement = `    let token = body.refreshToken || req.headers['x-refresh-token'] || req.cookies?.refresh_token;
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '').trim();
    }`;

if (!controller.includes("startsWith('Bearer ')")) {
  controller = controller.replace(target, replacement);
  fs.writeFileSync('src/auth/auth.controller.ts', controller);
}

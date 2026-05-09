/**
 * 在任意入口（bootstrap / mwtsc 开发）之前加载 .env，保证 config.* 里能读到 process.env。
 * - NODE_ENV=local 时优先 .env.local，其次 .env.development（与 npm 脚本常用命名对齐）
 * - 其他环境加载 .env.${NODE_ENV}，否则回退 .env
 */
const path = require('path');
const fs = require('fs');

const root = __dirname;
const nodeEnv = process.env.NODE_ENV || 'development';

const candidates = [path.join(root, `.env.${nodeEnv}`)];
if (nodeEnv === 'local') {
  candidates.push(path.join(root, '.env.development'));
}
candidates.push(path.join(root, '.env'));

for (const file of candidates) {
  if (fs.existsSync(file)) {
    require('dotenv').config({ path: file });
    break;
  }
}

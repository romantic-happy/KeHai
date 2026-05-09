'use strict';
/**
 * 从本文件所在目录加载 env 并启动 mwtsc，避免 node -r ./load-env.js 依赖 cwd 导致 MODULE_NOT_FOUND。
 */
const path = require('path');
const { spawn } = require('child_process');

require(path.join(__dirname, 'load-env.js'));

const mwtsc = path.join(__dirname, 'node_modules', 'mwtsc', 'bin', 'mwtsc.js');
const child = spawn(process.execPath, [mwtsc, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
  windowsHide: true,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code === null || code === undefined ? 1 : code);
});

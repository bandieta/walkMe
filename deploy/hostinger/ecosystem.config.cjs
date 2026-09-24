// PM2 process definition for the walkMe server. Used by deploy.sh.
const path = require('path');

const serverDir = path.resolve(__dirname, '../../server');

module.exports = {
  apps: [
    {
      name: 'walkme-server',
      cwd: serverDir, // .env, prod.db and uploads/ are resolved relative to this
      script: 'dist/index.js',
      // Single instance: SQLite + in-process Socket.io don't support cluster mode.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
      out_file: path.join(serverDir, 'logs/out.log'),
      error_file: path.join(serverDir, 'logs/error.log'),
      time: true,
    },
  ],
};

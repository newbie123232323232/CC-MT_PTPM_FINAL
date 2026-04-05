const proxy = require('http-proxy-middleware');

/** Timeout dài cho upload video qua dev server (tránh Network Error sớm). */
module.exports = function setupProxy(app) {
  app.use(
    proxy('/api', {
      target: 'http://localhost:5000',
      changeOrigin: true,
      timeout: 600000,
      proxyTimeout: 600000,
    })
  );
};

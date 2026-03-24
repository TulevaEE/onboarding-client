/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.PROXY_TARGET || 'http://localhost:9000';
  app.use(
    ['/v1', '/authenticate', '/oauth'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};

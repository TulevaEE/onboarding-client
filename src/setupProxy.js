/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.PROXY_TARGET || 'https://onboarding-service.tuleva.ee';
  app.use(
    ['/v1', '/authenticate', '/oauth'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};

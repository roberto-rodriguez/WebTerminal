 
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware(
      [
        "/FrontTerminal" 
      ],
      {
        target: "http://localhost:8085"
        // target: "http://localhost:5000"
      }
    )
  );
};

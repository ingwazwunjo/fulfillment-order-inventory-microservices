const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

/* =======================
   Proxy to Order Service
======================= */
app.use('/', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true
}));

/* =======================
   Health Check
======================= */
app.get('/', (req, res) => {
    res.send('🚀 Gateway is running');
});

/* =======================
   Start Gateway
======================= */
app.listen(8080, () => {
    console.log('🌐 Gateway running on port 8080');
});
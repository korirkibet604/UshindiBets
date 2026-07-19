// proxy-server.js
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getCachedUserAgent, getUserAgents } from './services/userAgents.js';

const app = express();

// Enable CORS
app.use(cors({
  origin: ['https://UshindiBets.onrender.com', 'http://localhost:5173'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

// User-Agent test endpoint
app.get('/test-user-agents', (req, res) => {
  const agents = getUserAgents();
  res.json({
    totalAgents: agents.length,
    currentAgent: getCachedUserAgent(),
    agents: agents.map(agent => agent.substring(0, 80) + '...')
  });
});

// Proxy middleware with User-Agent rotation
app.use('/api/proxy', createProxyMiddleware({
  target: 'https://api.sofascore.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Use rotating User-Agent
    const userAgent = getCachedUserAgent();
    console.log('Using User-Agent:', userAgent.substring(0, 50) + '...');

    proxyReq.setHeader('User-Agent', userAgent);
    proxyReq.setHeader('Accept', 'application/json');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
    proxyReq.setHeader('Referer', 'https://www.sofascore.com/');

    // Additional headers that might help
    proxyReq.setHeader('Origin', 'https://www.sofascore.com');
    proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
    proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
    proxyReq.setHeader('Sec-Fetch-Site', 'same-site');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ User-Agent test: http://localhost:${PORT}/test-user-agents`);
});
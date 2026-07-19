// server/index.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { PORT } from '../src/constants.js';
import { getRandomUserAgent } from '../src/services/userAgents.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Proxy all API requests
app.use('/api/*', async (req, res) => {
  try {
    const originalUrl = req.originalUrl.replace('/api/', '');
    const targetUrl = `https://api.sofascore.com/${originalUrl}`;

    console.log(`🔄 Proxying: ${req.method} ${targetUrl}`);

    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.sofascore.com/',
      'Origin': 'https://www.sofascore.com/',
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      params: req.query,
      data: req.body,
      timeout: 10000
    });

    // Forward the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);

    if (error.response) {
      // Forward the error response from SofaScore
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', server: 'SofaScore Proxy' });
});

const APP_PORT = PORT || 3001;
app.listen(APP_PORT, () => {
  console.log(`🚀 Proxy server running on port ${APP_PORT}`);
  console.log(`🔗 Health check: http://localhost:${APP_PORT}/health`);
});
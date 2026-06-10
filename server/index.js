require('dotenv').config();

const express = require('express');
const cors = require('cors');

// 导入路由
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const goalRoutes = require('./routes/goals');
const alertRoutes = require('./routes/alerts');
const passwordRoutes = require('./routes/password');
const squareRoutes = require('./routes/square');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const visionRoutes = require('./routes/vision');
const ocrRoutes = require('./routes/ocr');
const paddleOcrRoutes = require('./routes/paddleOcr');

const app = express();
const PORT = process.env.PORT || 3001;

// 从环境变量读取允许的域名，如果未设置则使用默认本地开发域名
// 你需要在 Render 环境变量中添加 CORS_ORIGIN，值为你的 Vercel 前端域名
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? [corsOrigin, 'http://localhost:3000', 'http://localhost:5173']
  : ['http://localhost:3000', 'http://localhost:5173', 'https://smart-healthcare-tracker-3jxn.vercel.app'];

// 临时允许所有跨域请求（仅用于测试，问题解决后可改回）
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/paddle-ocr', paddleOcrRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔧 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
    console.log(`👑 Admin routes enabled`);
});

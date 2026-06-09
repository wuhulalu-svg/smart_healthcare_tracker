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

// 数据库和定时任务（暂时注释，路由内部自己会连接数据库）
// const pool = require('./db');   // 如果需要主文件使用数据库再取消注释
// require('./cronJobs');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ 修改 CORS：允许你的 Vercel 前端域名 + 本地开发域名
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://你的前端项目名.vercel.app'   // 请替换成你的实际 Vercel 前端域名
];

app.use(cors({
    origin: function (origin, callback) {
        // 允许没有 origin 的请求（如 Postman）
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS 不允许此域名访问'));
        }
    },
    credentials: true
}));

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
    console.log(`🔧 CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`👑 Admin routes enabled`);
});

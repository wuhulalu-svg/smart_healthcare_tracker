const express = require('express');
const pool = require('../db');   // 改：引入 pool 而不是 db
const router = express.Router();

// 中间件加载（保持不变）
let authenticateToken, requireAdmin;
try {
    const auth = require('../middleware/auth');
    authenticateToken = auth.authenticateToken;
    requireAdmin = auth.requireAdmin;
} catch (err) {
    console.error('无法加载 auth 中间件:', err.message);
    authenticateToken = (req, res, next) => next();
    requireAdmin = (req, res, next) => next();
}

// 获取所有用户（仅管理员）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, age, gender, height, weight, role, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取单个用户详情
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // 获取用户基本信息
        const userResult = await pool.query(
            `SELECT id, name, email, age, gender, height, weight, role, created_at 
             FROM users WHERE id = $1`,
            [id]
        );
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 获取该用户的健康记录数量
        const countResult = await pool.query(
            'SELECT COUNT(*) as count FROM health_records WHERE user_id = $1',
            [id]
        );
        const recordCount = countResult.rows[0]?.count || 0;

        res.json({ ...user, recordCount });
    } catch (error) {
        console.error('Get user detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 更新用户角色
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            [role, id]
        );
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除用户
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    // 不允许删除自己
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    try {
        // PostgreSQL 支持事务，但用单独删除也可以（外键设置了 ON DELETE CASCADE 则子表自动删除）
        // 为了安全，按顺序手动删除（与原来逻辑一致）
        await pool.query('DELETE FROM health_records WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM health_goals WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM alerts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM square_posts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM square_likes WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM square_comments WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取系统统计信息
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // 一次查询获取多个统计值
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) AS "totalUsers",
                (SELECT COUNT(*) FROM health_records) AS "totalRecords",
                (SELECT COUNT(*) FROM square_posts) AS "totalPosts",
                (SELECT COUNT(*) FROM alerts WHERE "read" = false) AS "activeAlerts"
        `);
        const stats = statsResult.rows[0];

        // 获取最近7天活跃用户数（按日期分组）
        const activeResult = await pool.query(
            `SELECT DATE(date) as day, COUNT(DISTINCT user_id) as count
             FROM health_records 
             WHERE date >= CURRENT_DATE - INTERVAL '7 days'
             GROUP BY DATE(date)
             ORDER BY day`
        );
        const activeUsers = activeResult.rows;

        res.json({ ...stats, activeUsers });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

const express = require('express');
const pool = require('../db');   // 改用 pool
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有告警
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM alerts WHERE user_id = $1 ORDER BY date DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 创建告警
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, type, metric, date } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO alerts (user_id, title, description, type, metric, date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [req.user.id, title, description, type, metric, date]
        );
        const newId = result.rows[0].id;
        res.status(201).json({ id: newId, message: 'Alert created' });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 标记告警为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE alerts SET read = TRUE WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        res.json({ message: 'Alert marked as read' });
    } catch (error) {
        console.error('Mark alert read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

const express = require('express');
const pool = require('../db');   // 改用 pool
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有目标
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM health_goals WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        // 解析 missed_days JSON 字段
        const goals = result.rows.map(row => ({
            ...row,
            missed_days: JSON.parse(row.missed_days || '[]')
        }));
        res.json(goals);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 添加目标
router.post('/', authenticateToken, async (req, res) => {
    const { metric, metric_label, target_value, start_date, end_date, duration } = req.body;

    if (!metric || !metric_label || !target_value || !start_date || !end_date || !duration) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO health_goals (user_id, metric, metric_label, target_value, start_date, end_date, duration)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [req.user.id, metric, metric_label, target_value, start_date, end_date, duration]
        );
        const newGoal = result.rows[0];
        // 解析 missed_days（新目标默认空数组）
        newGoal.missed_days = JSON.parse(newGoal.missed_days || '[]');
        res.status(201).json(newGoal);
    } catch (error) {
        console.error('Add goal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 更新目标
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { completed, missed_days } = req.body;

    try {
        await pool.query(
            'UPDATE health_goals SET completed = $1, missed_days = $2 WHERE id = $3 AND user_id = $4',
            [completed, JSON.stringify(missed_days || []), id, req.user.id]
        );
        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除目标
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            'DELETE FROM health_goals WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

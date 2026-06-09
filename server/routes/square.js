const express = require('express');
const pool = require('../db');   // 改用 pool
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有动态（按时间倒序）
router.get('/posts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, u.name as user_name, u.email as user_email,
                   (SELECT COUNT(*) FROM square_likes WHERE post_id = p.id) as like_count,
                   (SELECT COUNT(*) FROM square_comments WHERE post_id = p.id) as comment_count,
                   EXISTS(SELECT 1 FROM square_likes WHERE post_id = p.id AND user_id = $1) as user_liked
            FROM square_posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        console.error('获取动态失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发布动态
router.post('/posts', authenticateToken, async (req, res) => {
    const { content, image } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: '内容不能为空' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO square_posts (user_id, content, image) VALUES ($1, $2, $3) RETURNING id',
            [req.user.id, content, image || null]
        );
        res.status(201).json({ id: result.rows[0].id, message: '发布成功' });
    } catch (error) {
        console.error('发布动态失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 点赞/取消点赞
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 检查是否已点赞
        const existing = await pool.query(
            'SELECT id FROM square_likes WHERE post_id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existing.rows.length > 0) {
            // 取消点赞
            await pool.query(
                'DELETE FROM square_likes WHERE post_id = $1 AND user_id = $2',
                [id, req.user.id]
            );
            res.json({ liked: false, message: '取消点赞' });
        } else {
            // 点赞
            await pool.query(
                'INSERT INTO square_likes (post_id, user_id) VALUES ($1, $2)',
                [id, req.user.id]
            );
            res.json({ liked: true, message: '点赞成功' });
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取评论
router.get('/posts/:id/comments', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT c.*, u.name as user_name, u.email as user_email
            FROM square_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发表评论
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: '评论内容不能为空' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO square_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
            [id, req.user.id, content]
        );
        res.status(201).json({ id: result.rows[0].id, message: '评论成功' });
    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除自己的动态
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 检查动态是否存在及其所有者
        const postResult = await pool.query(
            'SELECT user_id FROM square_posts WHERE id = $1',
            [id]
        );
        const post = postResult.rows[0];

        if (!post) {
            return res.status(404).json({ error: '动态不存在' });
        }

        if (post.user_id !== req.user.id) {
            return res.status(403).json({ error: '只能删除自己的动态' });
        }

        // 删除动态（由于外键设置了 ON DELETE CASCADE，相关评论和点赞会自动删除）
        await pool.query('DELETE FROM square_posts WHERE id = $1', [id]);

        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除动态失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;

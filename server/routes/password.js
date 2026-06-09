const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');   // 改用 pool
const { sendVerificationCode } = require('../config/email');
const router = express.Router();

// 存储验证码（生产环境建议用Redis）
const verificationCodes = new Map();

// 生成6位随机验证码
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码
router.post('/send-code', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: '邮箱不能为空' });
    }

    try {
        // 检查用户是否存在
        const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: '该邮箱未注册' });
        }

        // 生成验证码
        const code = generateCode();

        // 存储验证码（5分钟过期）
        verificationCodes.set(email, {
            code: code,
            expires: Date.now() + 5 * 60 * 1000
        });

        console.log(`验证码已生成: ${email} -> ${code}`);

        // 发送邮件
        const sent = await sendVerificationCode(email, code);

        if (sent) {
            res.json({ success: true, message: '验证码已发送，请查收邮件' });
        } else {
            res.status(500).json({ error: '邮件发送失败，请稍后再试' });
        }

    } catch (error) {
        console.error('发送验证码失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 验证验证码（只验证，不删除）
router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: '邮箱和验证码不能为空' });
    }

    const record = verificationCodes.get(email);

    if (!record) {
        return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }

    if (record.expires < Date.now()) {
        verificationCodes.delete(email);
        return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }

    if (record.code !== code) {
        return res.status(400).json({ error: '验证码错误' });
    }

    // 验证成功，不删除验证码记录，只返回成功
    res.json({ success: true, message: '验证成功' });
});

// 重置密码（同时验证并删除验证码）
router.post('/reset', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: '请填写完整信息' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    try {
        // 验证验证码
        const record = verificationCodes.get(email);

        if (!record) {
            return res.status(400).json({ error: '验证码已过期，请重新获取' });
        }

        if (record.expires < Date.now()) {
            verificationCodes.delete(email);
            return res.status(400).json({ error: '验证码已过期，请重新获取' });
        }

        if (record.code !== code) {
            return res.status(400).json({ error: '验证码错误' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

        // 重置成功后删除验证码记录
        verificationCodes.delete(email);

        console.log(`✅ 密码重置成功: ${email}`);
        res.json({ success: true, message: '密码重置成功' });

    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;

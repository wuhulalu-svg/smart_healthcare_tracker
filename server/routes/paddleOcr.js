const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// 从环境变量读取百度 OCR 密钥
const BAIDU_API_KEY = process.env.BAIDU_OCR_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;

let accessToken = null;
let tokenExpireTime = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpireTime) return accessToken;
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const response = await axios.post(url);
    accessToken = response.data.access_token;
    tokenExpireTime = Date.now() + 29 * 24 * 60 * 60 * 1000;
    return accessToken;
}

router.post('/recognize', async (req, res) => {
    try {
        let { image } = req.body;
        if (!image) return res.status(400).json({ error: '缺少图片' });
        // 移除 base64 前缀
        if (image.includes(',')) image = image.split(',')[1];

        const token = await getAccessToken();
        const formData = new FormData();
        formData.append('image', image);

        // 使用高精度版接口
        const response = await axios({
            method: 'POST',
            url: `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`,
            headers: formData.getHeaders(),
            data: formData,
            timeout: 30000
        });

        if (response.data.error_code) throw new Error(response.data.error_msg);
        const words = response.data.words_result?.map(w => w.words) || [];
        const text = words.join('\n');
        console.log('✅ 百度OCR高精度识别成功，文本长度:', text.length);
        res.json({ success: true, text });
    } catch (error) {
        console.error('❌ 百度OCR识别失败:', error.message);
        res.status(500).json({ error: '识别失败' });
    }
});

module.exports = router;

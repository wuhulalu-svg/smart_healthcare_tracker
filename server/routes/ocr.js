const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// 从环境变量读取百度 OCR 密钥
const API_KEY = process.env.BAIDU_OCR_API_KEY;
const SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;

let accessToken = null;
let tokenExpireTime = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpireTime) {
        return accessToken;
    }

    try {
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
        const response = await axios.post(url);
        accessToken = response.data.access_token;
        tokenExpireTime = Date.now() + 29 * 24 * 60 * 60 * 1000; // 29天后过期
        console.log('✅ 百度OCR Token获取成功');
        return accessToken;
    } catch (error) {
        console.error('❌ 获取百度OCR Token失败:', error.message);
        throw error;
    }
}

router.post('/recognize', async (req, res) => {
    try {
        let { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        // 移除可能的前缀
        if (image.includes(',')) {
            image = image.split(',')[1];
        }

        console.log('📷 图片Base64长度:', image.length);

        const token = await getAccessToken();

        // 使用 FormData 方式发送
        const formData = new FormData();
        formData.append('image', image);

        const response = await axios({
            method: 'POST',
            url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
            headers: {
                ...formData.getHeaders()
            },
            data: formData,
            timeout: 30000
        });

        if (response.data.error_code) {
            console.error('❌ 百度OCR错误:', response.data);
            return res.status(400).json({ error: response.data.error_msg });
        }

        const words = response.data.words_result?.map(w => w.words) || [];
        const fullText = words.join('\n');

        console.log('✅ 识别成功，文字数量:', words.length);
        console.log('📝 识别文本:', fullText.substring(0, 300));

        res.json({ text: fullText, success: true });

    } catch (error) {
        console.error('❌ OCR识别失败:', error.message);
        res.status(500).json({ error: 'OCR识别失败' });
    }
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Baidu OCR' });
});

module.exports = router;

const express = require('express');
const axios = require('axios');
const router = express.Router();

// 从环境变量读取 DeepSeek API Key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: '缺少图片数据' });
    }
    
    // 移除前缀
    let base64Image = image;
    if (base64Image.includes(',')) {
      base64Image = base64Image.split(',')[1];
    }
    
    console.log('📷 图片Base64长度:', base64Image.length);
    
    const prompt = `请从这张体检报告图片中提取以下健康数据，只返回JSON格式，不要有其他文字：

{
  "date": "日期(格式: YYYY-MM-DD)",
  "weight": "体重(kg)",
  "bmi": "BMI值",
  "bodyFat": "体脂率(%)",
  "bodyWater": "体水分量(kg)",
  "bodyFatMass": "脂肪量(kg)",
  "boneMass": "骨盐量(kg)",
  "protein": "蛋白质量(kg)",
  "muscleMass": "肌肉量(kg)",
  "visceralFat": "内脏脂肪等级",
  "basalMetabolicRate": "基础代谢率(kcal)",
  "heartRate": "心率(次/分)",
  "bodyAge": "身体年龄(岁)",
  "bloodPressure": "血压(mmHg)",
  "bloodSugar": "血糖(mmol/L)",
  "sleepLevel": "睡眠等级",
  "steps": "步数"
}

如果图片中没有某个数据，就写null。只返回JSON，不要解释。`;

    const response = await axios({
      method: 'POST',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      timeout: 60000
    });
    
    const result = response.data.choices[0].message.content;
    console.log('✅ AI识别完成');
    console.log('📝 AI返回:', result);
    
    // 解析JSON
    let extractedData = {};
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('JSON解析失败:', e);
    }
    
    res.json({ success: true, data: extractedData });
    
  } catch (error) {
    console.error('❌ AI识别失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
    res.status(500).json({ error: 'AI识别失败: ' + (error.response?.data?.error?.message || error.message) });
  }
});

module.exports = router;

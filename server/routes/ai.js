const express = require('express');
const axios = require('axios');
const router = express.Router();

// 从环境变量读取 API Key（不要硬编码）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

router.post('/chat', async (req, res) => {
  try {
    const { message, user, healthRecords } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }
    
    console.log('📨 收到消息:', message);
    
    // 构建系统提示词，包含用户健康数据
    let systemPrompt = `你是一位专业的健康顾问，名叫"小健"。你的职责是帮助用户解答健康相关的问题，提供专业的建议。

用户信息：
- 姓名：${user?.name || '用户'}
- 年龄：${user?.age || '未知'}岁
- 性别：${user?.gender || '未知'}
- 身高：${user?.height || '未知'}cm
- 体重：${user?.weight || '未知'}kg`;

    // 添加最近的健康记录
    if (healthRecords && healthRecords.length > 0) {
      const latestRecord = healthRecords[0];
      systemPrompt += `\n\n用户最近的健康数据（${latestRecord.date}）：
- 体重：${latestRecord.weight || '未知'} kg
- BMI：${latestRecord.bmi || '未知'}
- 体脂率：${latestRecord.bodyFat || '未知'}%
- 心率：${latestRecord.heartRate || '未知'} bpm
- 睡眠等级：${latestRecord.sleepLevel || '未知'}
- 步数：${latestRecord.steps || '未知'} 步`;

      if (latestRecord.bloodPressure) {
        systemPrompt += `\n- 血压：${latestRecord.bloodPressure} mmHg`;
      }
      if (latestRecord.bloodSugar) {
        systemPrompt += `\n- 血糖：${latestRecord.bloodSugar} mmol/L`;
      }
    }
    
    systemPrompt += `\n\n请基于用户的健康数据提供个性化的建议。回答要友好、专业、简洁。如果用户问的问题与健康无关，礼貌地引导回健康话题。`;

    console.log('🚀 调用 DeepSeek API...');
    
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      timeout: 30000
    });
    
    const reply = response.data.choices[0].message.content;
    console.log('✅ AI回复:', reply.substring(0, 100) + '...');
    res.json({ success: true, reply });
    
  } catch (error) {
    console.error('❌ AI对话失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
    res.status(500).json({ error: 'AI服务暂时不可用，请稍后再试' });
  }
});

module.exports = router;

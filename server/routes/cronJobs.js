// server/cronJobs.js
const cron = require('node-cron');
const pool = require('./db');   // 改用 pool

// 正常范围配置（示例）
const normalRanges = {
    heart_rate: { min: 60, max: 100, unit: 'bpm', title: '心率', description: '心率值 %.1f bpm，超出正常范围 (%d-%d)。请及时就医。' },
    blood_pressure_systolic: { min: 90, max: 120, unit: 'mmHg', title: '血压（收缩压）', description: '收缩压 %.0f mmHg，超出正常范围 (%d-%d)。请监测血压。' },
    blood_pressure_diastolic: { min: 60, max: 80, unit: 'mmHg', title: '血压（舒张压）', description: '舒张压 %.0f mmHg，超出正常范围 (%d-%d)。请监测血压。' },
    blood_sugar: { min: 3.9, max: 6.1, unit: 'mmol/L', title: '血糖', description: '血糖值 %.1f mmol/L，超出正常范围 (%.1f-%.1f)。请注意饮食。' },
    bmi: { min: 18.5, max: 24.9, unit: '', title: 'BMI', description: 'BMI %.1f，超出正常范围 (%.1f-%.1f)。请关注体重管理。' },
};

// 辅助函数：创建告警（避免重复）
async function createAlert(userId, type, title, description, metric, date) {
    try {
        // 检查是否已存在相同告警（避免重复）
        const existingResult = await pool.query(
            `SELECT id FROM alerts WHERE user_id = $1 AND type = $2 AND metric = $3 AND date = $4`,
            [userId, type, metric, date]
        );
        if (existingResult.rows.length > 0) return;

        // 插入新告警
        await pool.query(
            `INSERT INTO alerts (user_id, title, description, type, metric, date, read)
             VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
            [userId, title, description, type, metric, date]
        );
    } catch (err) {
        console.error('创建告警失败:', err);
    }
}

// 每天凌晨1点检查目标未完成（黄色告警）
cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] 检查未完成的目标...');
    const today = new Date().toISOString().split('T')[0];
    try {
        // 获取所有未完成且结束日期 >= 今天的健康目标
        const goalsResult = await pool.query(
            `SELECT * FROM health_goals WHERE completed = FALSE AND end_date >= CURRENT_DATE`
        );
        const goals = goalsResult.rows;

        for (const goal of goals) {
            // 获取该用户今天之前的最近一条健康记录（按日期降序取第一条）
            const recordResult = await pool.query(
                `SELECT * FROM health_records 
                 WHERE user_id = $1 AND date <= $2 
                 ORDER BY date DESC 
                 LIMIT 1`,
                [goal.user_id, today]
            );
            const record = recordResult.rows[0];
            if (!record) continue;

            let currentValue = null;
            switch (goal.metric) {
                case 'steps': currentValue = record.steps; break;
                case 'weight': currentValue = record.weight; break;
                case 'bmi': currentValue = record.bmi; break;
                case 'body_fat': currentValue = record.body_fat; break;
                case 'heart_rate': currentValue = record.heart_rate; break;
                case 'blood_pressure':
                    if (record.blood_pressure) currentValue = parseInt(record.blood_pressure.split('/')[0]);
                    break;
                case 'blood_sugar': currentValue = record.blood_sugar; break;
                case 'sleep_level': currentValue = record.sleep_level; break;
                case 'calories': currentValue = record.calories; break;
                default: continue;
            }

            if (currentValue !== null && currentValue < goal.target_value) {
                const description = `您未完成 ${goal.metric_label} 目标（目标值 ${goal.target_value}，当前值 ${currentValue}）。请继续努力！`;
                await createAlert(goal.user_id, 'warning', `⚠️ ${goal.metric_label} 目标未达标`, description, goal.metric, today);
            }
        }
    } catch (err) {
        console.error('目标检查定时任务出错:', err);
    }
});

// 每天凌晨2点检查健康数据异常（红色告警）
cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] 检查健康数据异常...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
        const recordsResult = await pool.query(
            `SELECT * FROM health_records WHERE date = $1`,
            [dateStr]
        );
        const records = recordsResult.rows;

        for (const record of records) {
            // 心率
            if (record.heart_rate) {
                const range = normalRanges.heart_rate;
                if (record.heart_rate < range.min || record.heart_rate > range.max) {
                    const description = `心率值为 ${record.heart_rate} bpm，超出正常范围 (${range.min}-${range.max})。请及时就医。`;
                    await createAlert(record.user_id, 'critical', '!!! 心率异常 !!!', description, 'heart_rate', dateStr);
                }
            }

            // 血压
            if (record.blood_pressure) {
                const parts = record.blood_pressure.split('/');
                const systolic = parseInt(parts[0]);
                const diastolic = parseInt(parts[1]);
                const sysRange = normalRanges.blood_pressure_systolic;
                const diaRange = normalRanges.blood_pressure_diastolic;
                if (systolic < sysRange.min || systolic > sysRange.max) {
                    const description = `收缩压 ${systolic} mmHg，超出正常范围 (${sysRange.min}-${sysRange.max})。请监测血压。`;
                    await createAlert(record.user_id, 'critical', '!!! 血压异常 !!!', description, 'blood_pressure', dateStr);
                }
                if (diastolic < diaRange.min || diastolic > diaRange.max) {
                    const description = `舒张压 ${diastolic} mmHg，超出正常范围 (${diaRange.min}-${diaRange.max})。请监测血压。`;
                    await createAlert(record.user_id, 'critical', '!!! 血压异常 !!!', description, 'blood_pressure', dateStr);
                }
            }

            // 血糖
            if (record.blood_sugar) {
                const range = normalRanges.blood_sugar;
                if (record.blood_sugar < range.min || record.blood_sugar > range.max) {
                    const description = `血糖值 ${record.blood_sugar} mmol/L，超出正常范围 (${range.min}-${range.max})。请注意饮食控制。`;
                    await createAlert(record.user_id, 'critical', '!!! 血糖异常 !!!', description, 'blood_sugar', dateStr);
                }
            }

            // BMI
            if (record.bmi) {
                const range = normalRanges.bmi;
                if (record.bmi < range.min || record.bmi > range.max) {
                    const description = `BMI ${record.bmi}，超出正常范围 (${range.min}-${range.max})。请关注体重管理。`;
                    await createAlert(record.user_id, 'critical', '!!! BMI 异常 !!!', description, 'bmi', dateStr);
                }
            }
        }
    } catch (err) {
        console.error('健康数据异常检查定时任务出错:', err);
    }
});

console.log('Cron jobs initialized');

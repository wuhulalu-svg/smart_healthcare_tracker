const express = require('express');
const pool = require('../db');   // 改用 pool
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 辅助函数：标准化日期格式（保持不变）
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    let normalized = dateStr.replace(/\//g, '-');
    const parts = normalized.split('-');
    if (parts.length === 3) {
        parts[1] = parts[1].padStart(2, '0');
        parts[2] = parts[2].padStart(2, '0');
        normalized = parts.join('-');
    }
    return normalized;
}

// 添加/更新健康记录
router.post('/records', authenticateToken, async (req, res) => {
    const {
        date,
        weight, bmi, bodyFat, bodyFatMass,
        bodyWater, bodyWaterRate, protein, proteinRate,
        muscleMass, muscleRate, skeletalMuscleMass,
        boneMass, boneMassRate, leanBodyMass,
        visceralFat, waistHipRatio, bodyAge, basalMetabolicRate,
        heartRate, bloodPressure, bloodSugar, bloodOxygen,
        sleepLevel, stressLevel, steps, calories
    } = req.body;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        // 检查是否已存在
        const existingResult = await pool.query(
            'SELECT * FROM health_records WHERE user_id = $1 AND date = $2',
            [req.user.id, normalizedDate]
        );
        const existing = existingResult.rows[0];

        if (existing) {
            // 合并更新：只更新传入的非空值，保留原有数据
            const finalWeight = weight !== undefined && weight !== null ? weight : existing.weight;
            const finalBmi = bmi !== undefined && bmi !== null ? bmi : existing.bmi;
            const finalBodyFat = bodyFat !== undefined && bodyFat !== null ? bodyFat : existing.body_fat;
            const finalBodyFatMass = bodyFatMass !== undefined && bodyFatMass !== null ? bodyFatMass : existing.body_fat_mass;
            const finalBodyWater = bodyWater !== undefined && bodyWater !== null ? bodyWater : existing.body_water;
            const finalBodyWaterRate = bodyWaterRate !== undefined && bodyWaterRate !== null ? bodyWaterRate : existing.body_water_rate;
            const finalProtein = protein !== undefined && protein !== null ? protein : existing.protein;
            const finalProteinRate = proteinRate !== undefined && proteinRate !== null ? proteinRate : existing.protein_rate;
            const finalMuscleMass = muscleMass !== undefined && muscleMass !== null ? muscleMass : existing.muscle_mass;
            const finalMuscleRate = muscleRate !== undefined && muscleRate !== null ? muscleRate : existing.muscle_rate;
            const finalSkeletalMuscleMass = skeletalMuscleMass !== undefined && skeletalMuscleMass !== null ? skeletalMuscleMass : existing.skeletal_muscle_mass;
            const finalBoneMass = boneMass !== undefined && boneMass !== null ? boneMass : existing.bone_mass;
            const finalBoneMassRate = boneMassRate !== undefined && boneMassRate !== null ? boneMassRate : existing.bone_mass_rate;
            const finalLeanBodyMass = leanBodyMass !== undefined && leanBodyMass !== null ? leanBodyMass : existing.lean_body_mass;
            const finalVisceralFat = visceralFat !== undefined && visceralFat !== null ? visceralFat : existing.visceral_fat;
            const finalWaistHipRatio = waistHipRatio !== undefined && waistHipRatio !== null ? waistHipRatio : existing.waist_hip_ratio;
            const finalBodyAge = bodyAge !== undefined && bodyAge !== null ? bodyAge : existing.body_age;
            const finalBasalMetabolicRate = basalMetabolicRate !== undefined && basalMetabolicRate !== null ? basalMetabolicRate : existing.basal_metabolic_rate;
            const finalHeartRate = heartRate !== undefined && heartRate !== null ? heartRate : existing.heart_rate;
            const finalBloodPressure = bloodPressure !== undefined && bloodPressure !== null ? bloodPressure : existing.blood_pressure;
            const finalBloodSugar = bloodSugar !== undefined && bloodSugar !== null ? bloodSugar : existing.blood_sugar;
            const finalBloodOxygen = bloodOxygen !== undefined && bloodOxygen !== null ? bloodOxygen : existing.blood_oxygen;
            const finalSleepLevel = sleepLevel !== undefined && sleepLevel !== null ? sleepLevel : existing.sleep_level;
            const finalStressLevel = stressLevel !== undefined && stressLevel !== null ? stressLevel : existing.stress_level;
            const finalSteps = steps !== undefined && steps !== null ? steps : existing.steps;
            const finalCalories = calories !== undefined && calories !== null ? calories : existing.calories;

            await pool.query(
                `UPDATE health_records SET
                    weight = $1, bmi = $2, body_fat = $3, body_fat_mass = $4,
                    body_water = $5, body_water_rate = $6, protein = $7, protein_rate = $8,
                    muscle_mass = $9, muscle_rate = $10, skeletal_muscle_mass = $11,
                    bone_mass = $12, bone_mass_rate = $13, lean_body_mass = $14,
                    visceral_fat = $15, waist_hip_ratio = $16, body_age = $17, basal_metabolic_rate = $18,
                    heart_rate = $19, blood_pressure = $20, blood_sugar = $21, blood_oxygen = $22,
                    sleep_level = $23, stress_level = $24, steps = $25, calories = $26
                WHERE user_id = $27 AND date = $28`,
                [
                    finalWeight, finalBmi, finalBodyFat, finalBodyFatMass,
                    finalBodyWater, finalBodyWaterRate, finalProtein, finalProteinRate,
                    finalMuscleMass, finalMuscleRate, finalSkeletalMuscleMass,
                    finalBoneMass, finalBoneMassRate, finalLeanBodyMass,
                    finalVisceralFat, finalWaistHipRatio, finalBodyAge, finalBasalMetabolicRate,
                    finalHeartRate, finalBloodPressure, finalBloodSugar, finalBloodOxygen,
                    finalSleepLevel, finalStressLevel, finalSteps, finalCalories,
                    req.user.id, normalizedDate
                ]
            );
            res.json({ message: 'Health record updated successfully', date: normalizedDate });
        } else {
            // 插入新记录
            await pool.query(
                `INSERT INTO health_records (
                    user_id, date, weight, bmi, body_fat, body_fat_mass,
                    body_water, body_water_rate, protein, protein_rate,
                    muscle_mass, muscle_rate, skeletal_muscle_mass,
                    bone_mass, bone_mass_rate, lean_body_mass,
                    visceral_fat, waist_hip_ratio, body_age, basal_metabolic_rate,
                    heart_rate, blood_pressure, blood_sugar, blood_oxygen,
                    sleep_level, stress_level, steps, calories
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`,
                [
                    req.user.id, normalizedDate,
                    weight || null, bmi || null, bodyFat || null, bodyFatMass || null,
                    bodyWater || null, bodyWaterRate || null, protein || null, proteinRate || null,
                    muscleMass || null, muscleRate || null, skeletalMuscleMass || null,
                    boneMass || null, boneMassRate || null, leanBodyMass || null,
                    visceralFat || null, waistHipRatio || null, bodyAge || null, basalMetabolicRate || null,
                    heartRate || null, bloodPressure || null, bloodSugar || null, bloodOxygen || null,
                    sleepLevel || null, stressLevel || null, steps || null, calories || null
                ]
            );
            res.status(201).json({ message: 'Health record added successfully', date: normalizedDate });
        }
    } catch (error) {
        console.error('Save health record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取健康记录列表
router.get('/records', authenticateToken, async (req, res) => {
    const { limit = 100 } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM health_records 
             WHERE user_id = $1 
             ORDER BY date DESC 
             LIMIT $2`,
            [req.user.id, limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get health records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取单条健康记录
router.get('/records/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    const normalizedDate = normalizeDate(date);
    try {
        const result = await pool.query(
            'SELECT * FROM health_records WHERE user_id = $1 AND date = $2',
            [req.user.id, normalizedDate]
        );
        const record = result.rows[0];
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(record);
    } catch (error) {
        console.error('Get health record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除健康记录
router.delete('/records/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM health_records WHERE user_id = $1 AND date = $2',
            [req.user.id, date]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json({ message: 'Health record deleted successfully', affected: result.rowCount });
    } catch (error) {
        console.error('Delete health record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

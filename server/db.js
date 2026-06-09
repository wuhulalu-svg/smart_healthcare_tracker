const { Pool } = require('pg');

// 创建连接池
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }   // Render 必须
});

// 初始化数据库表（自动创建）
async function initDatabase() {
    // 用户表（注意：自增主键用 SERIAL，布尔值用 BOOLEAN，datetime 用 TIMESTAMP）
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            height REAL,
            weight REAL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 健康记录表
    const createHealthRecordsTable = `
        CREATE TABLE IF NOT EXISTS health_records (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date TEXT NOT NULL,
            weight REAL,
            bmi REAL,
            body_fat REAL,
            body_fat_mass REAL,
            body_water REAL,
            body_water_rate REAL,
            protein REAL,
            protein_rate REAL,
            muscle_mass REAL,
            muscle_rate REAL,
            skeletal_muscle_mass REAL,
            bone_mass REAL,
            bone_mass_rate REAL,
            lean_body_mass REAL,
            visceral_fat INTEGER,
            waist_hip_ratio REAL,
            body_age INTEGER,
            basal_metabolic_rate INTEGER,
            heart_rate INTEGER,
            blood_pressure TEXT,
            blood_sugar REAL,
            blood_oxygen REAL,
            sleep_level INTEGER,
            stress_level INTEGER,
            steps INTEGER,
            calories INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
        )
    `;

    // 健康目标表
    const createHealthGoalsTable = `
        CREATE TABLE IF NOT EXISTS health_goals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            metric TEXT NOT NULL,
            metric_label TEXT NOT NULL,
            target_value REAL NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            duration INTEGER NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            missed_days TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 告警表
    const createAlertsTable = `
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            type TEXT NOT NULL,
            metric TEXT,
            read BOOLEAN DEFAULT FALSE,
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 广场动态表
    const createSquarePostsTable = `
        CREATE TABLE IF NOT EXISTS square_posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            image TEXT,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 点赞记录表
    const createSquareLikesTable = `
        CREATE TABLE IF NOT EXISTS square_likes (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, user_id)
        )
    `;

    // 评论表
    const createSquareCommentsTable = `
        CREATE TABLE IF NOT EXISTS square_comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES square_posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        await pool.query(createUsersTable);
        await pool.query(createHealthRecordsTable);
        await pool.query(createHealthGoalsTable);
        await pool.query(createAlertsTable);
        await pool.query(createSquarePostsTable);
        await pool.query(createSquareLikesTable);
        await pool.query(createSquareCommentsTable);
        console.log('✅ 所有 PostgreSQL 表已准备就绪');
    } catch (err) {
        console.error('❌ 初始化表失败:', err);
    }
}

// 执行初始化
initDatabase();

// 导出 pool（用于其他文件）
module.exports = pool;

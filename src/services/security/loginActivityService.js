const pool = require("../../config/db");

const saveLoginActivity = async ({
    userId,
    ipAddress,
    userAgent,
    browser,
    os,
    device,
    country,
    city,
    loginSuccess,
    riskScore,
    riskLevel,
    isNewDevice,
    isSuspicious
}) => {

    const query = `
        INSERT INTO login_activity (
            user_id,
            ip_address,
            user_agent,
            browser,
            os,
            device,
            country,
            city,
            login_success,
            risk_score,
            risk_level,
            is_new_device,
            is_suspicious
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
    `;

    const values = [
        userId,
        ipAddress,
        userAgent,
        browser,
        os,
        device,
        country,
        city,
        loginSuccess,
        riskScore,
        riskLevel,
        isNewDevice,
        isSuspicious
    ];

    await pool.query(query, values);
};

const getRecentLogins = async (userId) => {

    const query = `
        SELECT *
        FROM login_activity
        WHERE user_id = $1
        ORDER BY login_time DESC
        LIMIT 10
    `;

    const result = await pool.query(query, [userId]);

    return result.rows;
};

module.exports = {
    saveLoginActivity,
    getRecentLogins
};
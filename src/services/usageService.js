const pool = require("../config/db");

const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

const getUserUsage = async (userId) => {
  const usageMonth = getCurrentMonth();

  const result = await pool.query(
    `SELECT 
       COALESCE(SUM(tokens_used), 0) AS tokens_used,
       COALESCE(SUM(cost_used), 0) AS cost_used
     FROM ai_usage
     WHERE user_id = $1
     AND usage_month = $2`,
    [userId, usageMonth]
  );

  return {
    tokensUsed: Number(result.rows[0].tokens_used),
    costUsed: Number(result.rows[0].cost_used)
  };
};

const recordUsage = async ({
  userId,
  tokensUsed,
  costUsed,
  model = "test-model",
  endpoint = "unknown"
}) => {
  const usageMonth = getCurrentMonth();

  const result = await pool.query(
    `INSERT INTO ai_usage 
     (user_id, tokens_used, cost_used, usage_month, model, endpoint)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, tokensUsed, costUsed, usageMonth, model, endpoint]
  );

  return result.rows[0];
};

module.exports = {
  getCurrentMonth,
  getUserUsage,
  recordUsage
};
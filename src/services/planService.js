const pool = require("../config/db");

/*
  This service handles plan selection.

  Priority:
  1. Use user's active subscription if available
  2. Otherwise fallback to Free plan
*/

const getFallbackFreePlan = async () => {
  const result = await pool.query(
    `SELECT 
       id,
       name,
       monthly_token_limit,
       monthly_cost_limit
     FROM plans
     WHERE LOWER(name) = 'free'
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    const err = new Error("Fallback Free plan not found");
    err.status = 500;
    throw err;
  }

  return {
    ...result.rows[0],
    isFallback: true
  };
};

const getActivePlanOrFallback = async (userId) => {
  const result = await pool.query(
    `SELECT 
       p.id,
       p.name,
       p.monthly_token_limit,
       p.monthly_cost_limit
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1
     AND s.status = 'active'
     AND s.end_date > NOW()
     ORDER BY s.end_date DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length > 0) {
    return {
      ...result.rows[0],
      isFallback: false
    };
  }

  return await getFallbackFreePlan();
};

module.exports = {
  getActivePlanOrFallback,
  getFallbackFreePlan
};
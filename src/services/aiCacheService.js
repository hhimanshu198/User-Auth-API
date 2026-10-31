const crypto = require("crypto");
const pool = require("../config/db");

/* ===============================
   CREATE CACHE KEY
================================ */
const createCacheKey = ({ prompt, model }) => {
  const normalizedPrompt = prompt.trim().toLowerCase();

  return crypto
    .createHash("sha256")
    .update(`${model}:${normalizedPrompt}`)
    .digest("hex");
};

/* ===============================
   GET CACHED AI RESPONSE
================================ */
const getCachedResponse = async ({ userId, cacheKey }) => {
  const result = await pool.query(
    `SELECT *
     FROM ai_response_cache
     WHERE user_id = $1
     AND cache_key = $2
     AND expires_at > NOW()
     LIMIT 1`,
    [userId, cacheKey]
  );

  return result.rows[0] || null;
};

/* ===============================
   SAVE AI RESPONSE TO CACHE
================================ */
const saveCachedResponse = async ({
  userId,
  cacheKey,
  prompt,
  model,
  response,
  tokensUsed,
  costUsed,
  endpoint,
  ttlMinutes = 60
}) => {
  const result = await pool.query(
    `INSERT INTO ai_response_cache
     (user_id, cache_key, prompt, model, response, tokens_used, cost_used, endpoint, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + ($9 || ' minutes')::INTERVAL)
     ON CONFLICT (user_id, cache_key)
     DO UPDATE SET
       response = EXCLUDED.response,
       tokens_used = EXCLUDED.tokens_used,
       cost_used = EXCLUDED.cost_used,
       endpoint = EXCLUDED.endpoint,
       created_at = NOW(),
       expires_at = EXCLUDED.expires_at
     RETURNING *`,
    [
      userId,
      cacheKey,
      prompt,
      model,
      response,
      tokensUsed,
      costUsed,
      endpoint,
      ttlMinutes
    ]
  );

  return result.rows[0];
};

module.exports = {
  createCacheKey,
  getCachedResponse,
  saveCachedResponse
};
const pool = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const UAParser = require("ua-parser-js");
const logger = require("../utils/logger");

const { getLocationFromIP } = require("../services/security/geoService");
const { generateDeviceFingerprint } = require("../services/security/deviceFingerprint");
const { calculateRiskScore } = require("../services/security/riskEngine");
const { saveLoginActivity, getRecentLogins } = require("../services/security/loginActivityService");
const { detectSuspiciousLogin } = require("../services/security/suspiciousDetector");

/* =========================
   SIGNUP
========================= */

const signup = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const err = new Error("All fields are required");
    err.status = 400;
    throw err;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    const err = new Error("Invalid email format");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const err = new Error("Email already registered");
      err.status = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);

    const userResult = await client.query(
      `INSERT INTO users (name,email,password_hash,role_id,failed_attempts,token_version)
       VALUES ($1,$2,$3,$4,0,0)
       RETURNING id,name,email`,
      [name, email, passwordHash, 2]
    );

    await client.query(
      `INSERT INTO subscriptions 
       (user_id, plan_id, start_date, end_date, status)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '3650 days', 'active')`,
      [userResult.rows[0].id, 1]
    );

    await client.query("COMMIT");

    return userResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      error.status = 409;
      error.message = "Email already exists";
    }

    throw error;
  } finally {
    client.release();
  }
};

/* =========================
   LOGIN
========================= */

const login = async ({ email, password }, req) => {

  if (!email || !password) {
    const err = new Error("Email and password required");
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  const user = result.rows[0];

  /* ========= UNKNOWN EMAIL ========= */
  if (!user) {
    logger.warn(`Invalid login attempt`);

    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  /* ========= WRONG PASSWORD ========= */
  const validPassword = await comparePassword(
    password,
    user.password_hash
  );

  if (!validPassword) {
    logger.warn(`Invalid password attempt for user: ${email}`);

    await pool.query(
      "UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id=$1",
      [user.id]
    );

    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  /* ========= SUCCESSFUL PASSWORD MATCH ========= */

  // Reset failed attempts
  await pool.query(
    "UPDATE users SET failed_attempts = 0 WHERE id=$1",
    [user.id]
  );

  /* ========= DEVICE + LOCATION ANALYSIS ========= */

  const parser = new UAParser(req.headers["user-agent"]);

  const browser = parser.getBrowser().name || "Unknown";
  const os = parser.getOS().name || "Unknown";
  const device = parser.getDevice().type || "Desktop";

  const ipAddress = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.socket.remoteAddress;

  const userAgent = req.headers["user-agent"];

  const location = await getLocationFromIP(ipAddress);

  const country = location?.country || "Unknown";
  const city = location?.city || "Unknown";

  logger.info(
    `Login location detected for ${email}: ${city}, ${country}`
  );

  const previousLogins = await getRecentLogins(user.id);

  let suspiciousAnalysis;

  if (previousLogins.length === 0) {
    suspiciousAnalysis = {
      isNewDevice: false,
      isNewCountry: false,
      unusualLoginTime: false
    };
  } else {
    suspiciousAnalysis = detectSuspiciousLogin({
      currentLogin: {
        browser,
        os,
        device,
        country
      },
      previousLogins
    });
  }

  if (
    suspiciousAnalysis.isNewDevice ||
    suspiciousAnalysis.isNewCountry ||
    suspiciousAnalysis.unusualLoginTime
  ) {
    logger.warn(
      `Suspicious login indicators for ${email} | ` +
      `New Device: ${suspiciousAnalysis.isNewDevice}, ` +
      `New Country: ${suspiciousAnalysis.isNewCountry}, ` +
      `Unusual Time: ${suspiciousAnalysis.unusualLoginTime}`
    );
  }

  /* ========= RISK ENGINE ========= */

  const riskAnalysis = calculateRiskScore({
    isNewDevice: suspiciousAnalysis.isNewDevice,
    isNewCountry: suspiciousAnalysis.isNewCountry,
    failedAttempts: user.failed_attempts,
    unusualLoginTime: suspiciousAnalysis.unusualLoginTime
  });

  logger.info(
    `Risk analysis for ${email}: ` +
    `Score=${riskAnalysis.riskScore}, ` +
    `Level=${riskAnalysis.riskLevel}`
  );

  /* ========= BLOCK HIGH RISK BEFORE TOKEN ========= */

  if (riskAnalysis.riskLevel === "HIGH") {

    await saveLoginActivity({
      userId: user.id,
      ipAddress,
      userAgent,
      browser,
      os,
      device,
      country,
      city,
      loginSuccess: false,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      isNewDevice: suspiciousAnalysis.isNewDevice,
      isSuspicious: true
    });

    logger.error(
      `HIGH RISK login blocked for ${email} ` +
      `from ${city}, ${country}`
    );

    const err = new Error("Suspicious login detected. Access denied.");
    err.status = 403;
    throw err;
  }

  /* ========= SAVE SUCCESSFUL LOGIN ========= */

  await saveLoginActivity({
    userId: user.id,
    ipAddress,
    userAgent,
    browser,
    os,
    device,
    country,
    city,
    loginSuccess: true,
    riskScore: riskAnalysis.riskScore,
    riskLevel: riskAnalysis.riskLevel,
    isNewDevice: suspiciousAnalysis.isNewDevice,
    isSuspicious: riskAnalysis.isSuspicious
  });

  /* ========= GENERATE TOKEN ========= */

  const token = generateToken({
    id: user.id,
    role_id: user.role_id,
    token_version: user.token_version
  });

  logger.info(
    `Successful secure login for ${email} ` +
    `using ${browser} on ${os}`
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id
    },
    security: {
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      suspicious: riskAnalysis.isSuspicious
    }
  };
};

module.exports = {
  signup,
  login
};
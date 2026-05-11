const pool = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");

const signup = async ({ name, email, password }) => {

  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);

  const roleId = 2;

  const result = await pool.query(
    `INSERT INTO users (name,email,password_hash,role_id)
     VALUES ($1,$2,$3,$4)
     RETURNING id,name,email`,
    [name, email, passwordHash, roleId]

  );
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
    VALUES ($1, $2, NOW(), NOW() + INTERVAL '3650 days', 'active')`,
    [user.id, 1]
);

  return result.rows[0];
};

const login = async ({ email, password }) => {

  if (!email || !password) {
    throw new Error("Email and password required");
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await comparePassword(
    password,
    user.password_hash
  );

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    id: user.id,
    role_id: user.role_id
  });

  return {
    token
  };
};

module.exports = {
  signup,
  login
};
const pool = require("../config/db");

const getProfile = async (req, res) => {

  const userId = req.user.id;

  const result = await pool.query(
    "SELECT id,name,email,role_id FROM users WHERE id=$1",
    [userId]
  );

  res.json(result.rows[0]);
};

const getAllUsers = async (req, res) => {

  const result = await pool.query(
    "SELECT id,name,email,role_id FROM users"
  );

  res.json(result.rows);
};

const deleteUser = async (req, res) => {

  const { id } = req.params;

  await pool.query(
    "DELETE FROM users WHERE id=$1",
    [id]
  );

  res.json({
    message: "User deleted"
  });
};

module.exports = {
  getProfile,
  getAllUsers,
  deleteUser
};
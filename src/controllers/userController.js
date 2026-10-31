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

  const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING *",[id]);

  if (result.rows.length === 0) {
    
    return res.status(404).json({
      
      error: "User not found"
    });
  }

  res.json({
    
    message: "User deleted successfully",
    deletedUser: result.rows[0]
  });
};

module.exports = {
  getProfile,
  getAllUsers,
  deleteUser
};
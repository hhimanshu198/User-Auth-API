const pool = require("../config/db");

const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id } = req.body;

    // Get plan price
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE id=$1",
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const plan = planResult.rows[0];

    // Create payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (user_id, amount, status, payment_gateway)
       VALUES ($1, $2, 'pending', 'stripe')
       RETURNING *`,
      [userId, plan.price]
    );

    res.json({
      message: "Payment created",
      payment: paymentResult.rows[0],
      plan: plan
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPayment };
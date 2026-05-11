const pool = require("../config/db");

const handleWebhook = async (req, res) => {
  try {
    const { payment_id, status, payment_gateway_id } = req.body;

    // Update payment status
    const paymentResult = await pool.query(
      `UPDATE payments
       SET status=$1, payment_gateway_id=$2
       WHERE id=$3
       RETURNING *`,
      [status, payment_gateway_id, payment_id]
    );

    const payment = paymentResult.rows[0];

    if (status === "success") {
      // Get plan (assuming amount matches plan)
      const planResult = await pool.query(
        "SELECT * FROM plans WHERE price=$1",
        [payment.amount]
      );

      const plan = planResult.rows[0];

      // Create subscription
      await pool.query(
        `INSERT INTO subscriptions
         (user_id, plan_id, start_date, end_date, status)
         VALUES ($1, $2, NOW(), NOW() + ($3 || ' days')::INTERVAL, 'active')`,
        [payment.user_id, plan.id, plan.duration_days]
      );
    }

    res.json({ message: "Webhook processed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { handleWebhook };
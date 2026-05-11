const express= require("express");
require("dotenv").config();
const pool= require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const app= express();
app.use("/webhook", webhookRoutes);
app.use(express.json());

app.use("/payments", paymentRoutes);
app.use("/auth", authRoutes);
const userRoutes = require("./src/routes/userRoutes");

app.use("/users", userRoutes);

app.get('/', async(req,res)=>{
    const result= await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
});
const PORT=process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
});
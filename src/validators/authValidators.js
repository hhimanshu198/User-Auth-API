const { z } = require("zod");

const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .trim(),

  email: z
    .string()
    .email("Invalid email")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password required")
});

module.exports = {
  signupSchema,
  loginSchema
};
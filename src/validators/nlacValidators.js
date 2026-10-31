const { z } = require("zod");

const nlacSchema = z.object({
  request: z
    .string()
    .min(5, "Request must be at least 5 characters")
    .max(300, "Request too long")
    .trim()
});

module.exports = {
  nlacSchema
};
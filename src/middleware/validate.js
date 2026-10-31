const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);

      req.validatedData = validatedData;

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: (error.issues || []).map((err) => ({
          field: err.path[0],
          message: err.message
        }))
      });
    }
  };
};

module.exports = validate;
const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator validation errors.
 * Should be placed after validation chains in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = { validate };

const { body, query } = require('express-validator');

const VALID_CATEGORIES = [
  'food', 'transport', 'entertainment',
  'utilities', 'healthcare', 'shopping', 'other'
];

const createExpenseValidation = [
  body('amount')
    .isString()
    .matches(/^\d+\.\d{2}$/)
    .withMessage('Amount must have exactly 2 decimal places (e.g., "123.45")')
    .custom(value => parseFloat(value) > 0 && parseFloat(value) < 1e10)
    .withMessage('Amount must be positive and less than 10 billion'),

  body('category')
    .isString()
    .trim()
    .toLowerCase()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),

  body('date')
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom(value => {
      const date = new Date(value);
      const now = new Date();
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(now.getFullYear() - 10);
      return date <= now && date >= tenYearsAgo;
    })
    .withMessage('Date must be within the last 10 years and not in the future')
];

const listExpensesValidation = [
  query('category')
    .optional()
    .isString()
    .trim()
    .toLowerCase()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  query('sort')
    .optional()
    .isIn(['date_desc'])
    .withMessage('Sort must be "date_desc"')
];

module.exports = {
  createExpenseValidation,
  listExpensesValidation
};

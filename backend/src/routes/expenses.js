const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ExpenseService = require('../services/expenseService');
const { idempotencyMiddleware } = require('../middleware/idempotency');

const router = express.Router();
const expenseService = new ExpenseService();

// Validation rules
const VALID_CATEGORIES = ['food', 'transport', 'entertainment', 'utilities', 'healthcare', 'shopping', 'other'];

const createExpenseValidation = [
  body('amount')
    .isString()
    .withMessage('Amount must be a string')
    .matches(/^\d+\.\d{2}$/)
    .withMessage('Amount must have exactly 2 decimal places (e.g., "123.45")')
    .custom((value) => {
      const num = parseFloat(value);
      return num > 0 && num < 10000000000;
    })
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
    .custom((value) => {
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

// POST /expenses - Create new expense
router.post(
  '/',
  idempotencyMiddleware,
  createExpenseValidation,
  async (req, res, next) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const { amount, category, description, date } = req.body;
      
      const expense = await expenseService.createExpense({
        amount,
        category: category.toLowerCase(),
        description: description.trim(),
        date
      });

      // Cache response for idempotency
      req.cacheIdempotentResponse(201, expense);
      
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }
);

// GET /expenses - List expenses with optional filters
router.get(
  '/',
  listExpensesValidation,
  async (req, res, next) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const { category, sort } = req.query;
      
      const options = {
        category: category ? category.toLowerCase() : undefined,
        sortByDateDesc: sort === 'date_desc'
      };

      const result = await expenseService.listExpenses(options);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
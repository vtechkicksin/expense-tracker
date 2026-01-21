const express = require('express');
const ExpenseService = require('../services/expenseService');
const ExpenseController = require('../controllers/expenseController');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const { createExpenseValidation, listExpensesValidation } = require('../validator/expenseValidator');

const router = express.Router();
const expenseService = new ExpenseService();
const expenseController = new ExpenseController(expenseService);

router.post(
  '/',
  idempotencyMiddleware,
  createExpenseValidation,
  expenseController.createExpense
);

router.get(
  '/',
  listExpensesValidation,
  expenseController.listExpenses
);

module.exports = router;

const express = require('express');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const ExpenseController = require('../controllers/expenseController');

const expenseService = new ExpenseService();
const expenseController = new ExpenseController(expenseService);

const router = express.Router();

router.post('/', idempotencyMiddleware, expenseController.createExpense);
router.get('/', expenseController.listExpenses);

module.exports = router;

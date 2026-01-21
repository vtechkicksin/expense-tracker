const { validationResult } = require('express-validator');

class ExpenseController {
  constructor(expenseService) {
    this.expenseService = expenseService;
  }

  createExpense = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { amount, category, description, date } = req.body;
      const expense = await this.expenseService.createExpense({
        amount,
        category: category.toLowerCase(),
        description: description.trim(),
        date
      });

      if (req.cacheIdempotentResponse) {
        await req.cacheIdempotentResponse(201, expense);
      }

      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  };

  listExpenses = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { category, sort } = req.query;
      const options = {
        category: category ? category.toLowerCase() : undefined,
        sortByDateDesc: sort === 'date_desc'
      };

      const expenses = await this.expenseService.listExpenses(options);
      res.json(expenses);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ExpenseController;

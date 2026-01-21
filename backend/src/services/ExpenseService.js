const Decimal = require('decimal.js');
const { pool } = require('../db/database');

class ExpenseService {
  /**
   * Create a new expense
   * @param {Object} data - Expense data
   * @param {string} data.amount - Amount as string (e.g., "123.45")
   * @param {string} data.category - Expense category
   * @param {string} data.description - Expense description
   * @param {string} data.date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Created expense
   */
  async createExpense({ amount, category, description, date }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert expense
      const result = await client.query(
        `INSERT INTO expenses (amount, category, description, date)
         VALUES ($1, $2, $3, $4)
         RETURNING id, amount, category, description, date, created_at`,
        [amount, category, description, date]
      );

      await client.query('COMMIT');

      const expense = result.rows[0];
      
      // Convert amount to string for JSON response
      return {
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        created_at: expense.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    } finally {
      client.release();
    }
  }

  /**
   * List expenses with optional filtering and sorting
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category (optional)
   * @param {boolean} options.sortByDateDesc - Sort by date descending (optional)
   * @returns {Promise<Object>} List of expenses with total
   */
  async listExpenses(options = {}) {
    const { category, sortByDateDesc } = options;
    
    const client = await pool.connect();
    
    try {
      let query = 'SELECT id, amount, category, description, date, created_at FROM expenses';
      const params = [];
      const conditions = [];

      // Add category filter
      if (category) {
        conditions.push(`category = $${params.length + 1}`);
        params.push(category);
      }

      // Build WHERE clause
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add sorting
      if (sortByDateDesc) {
        query += ' ORDER BY date DESC, created_at DESC';
      } else {
        query += ' ORDER BY created_at DESC';
      }

      // Execute query
      const result = await client.query(query, params);
      const expenses = result.rows;

      // Calculate total using Decimal.js for precision
      let total = new Decimal(0);
      expenses.forEach(expense => {
        total = total.plus(new Decimal(expense.amount));
      });

      return {
        expenses: expenses.map(e => ({
          id: e.id,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: e.date,
          created_at: e.created_at
        })),
        total: total.toFixed(2),
        count: expenses.length
      };
    } catch (error) {
      console.error('Error listing expenses:', error);
      throw new Error('Failed to list expenses');
    } finally {
      client.release();
    }
  }

  /**
   * Get expense by ID
   * @param {string} id - Expense UUID
   * @returns {Promise<Object|null>} Expense or null if not found
   */
  async getExpenseById(id) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, amount, category, description, date, created_at FROM expenses WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const expense = result.rows[0];
      return {
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        created_at: expense.created_at
      };
    } catch (error) {
      console.error('Error getting expense:', error);
      throw new Error('Failed to get expense');
    } finally {
      client.release();
    }
  }
}

module.exports = ExpenseService;
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi } from '../api/client';
import { format } from 'date-fns';
import './ExpenseList.css';

const CATEGORY_LABELS = {
  food: 'Food & Dining',
  transport: 'Transportation',
  entertainment: 'Entertainment',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  shopping: 'Shopping',
  other: 'Other'
};

function ExpenseList({ filters }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.listExpenses({
      category: filters.category || undefined,
      sortByDateDesc: filters.sortByDateDesc
    }),
    staleTime: 10000 // Consider data fresh for 10 seconds
  });

  if (isLoading) {
    return (
      <div className="expense-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="expense-list-container">
        <div className="error-state">
          <p>Failed to load expenses</p>
          <small>{error?.message || 'Please try again later'}</small>
        </div>
      </div>
    );
  }

  const { expenses, total, count } = data;

  if (expenses.length === 0) {
    return (
      <div className="expense-list-container">
        <div className="empty-state">
          <p>No expenses found</p>
          <small>
            {filters.category 
              ? 'Try removing the category filter'
              : 'Add your first expense above'}
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-list-container">
      <div className="list-header">
        <div className="total-section">
          <span className="total-label">Total:</span>
          <span className="total-amount">₹{total}</span>
          <span className="count-label">({count} {count === 1 ? 'expense' : 'expenses'})</span>
        </div>
      </div>

      <div className="expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th className="amount-column">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="date-cell">
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </td>
                <td className="category-cell">
                  <span className={`category-badge category-${expense.category}`}>
                    {CATEGORY_LABELS[expense.category] || expense.category}
                  </span>
                </td>
                <td className="description-cell">
                  {expense.description}
                </td>
                <td className="amount-cell">
                  ₹{expense.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExpenseList;
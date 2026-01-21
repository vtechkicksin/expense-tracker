import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../api/client';
import { format } from 'date-fns';
import './ExpenseForm.css';

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' }
];

function ExpenseForm() {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [errors, setErrors] = useState({});

  // Mutation for creating expense
  const createExpenseMutation = useMutation({
    mutationFn: expenseApi.createExpense,
    onSuccess: (newExpense) => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      // Reset form
      setFormData({
        amount: '',
        category: 'food',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      
      setErrors({});
      
      console.log('Expense created successfully:', newExpense);
    },
    onError: (error) => {
      console.error('Failed to create expense:', error);
      
      if (error.response?.data?.details) {
        // Handle validation errors
        const validationErrors = {};
        error.response.data.details.forEach(err => {
          validationErrors[err.path] = err.msg;
        });
        setErrors(validationErrors);
      } else {
        setErrors({ 
          submit: error.response?.data?.error || 'Failed to create expense. Please try again.' 
        });
      }
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate amount
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountFloat = parseFloat(formData.amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (!/^\d+(\.\d{1,2})?$/.test(formData.amount)) {
        newErrors.amount = 'Amount must have at most 2 decimal places';
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Format amount to exactly 2 decimal places
    const formattedAmount = parseFloat(formData.amount).toFixed(2);

    createExpenseMutation.mutate({
      amount: formattedAmount,
      category: formData.category,
      description: formData.description.trim(),
      date: formData.date
    });
  };

  const isSubmitting = createExpenseMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="amount">
            Amount (₹) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            disabled={isSubmitting}
            className={errors.amount ? 'error' : ''}
          />
          {errors.amount && (
            <span className="error-message">{errors.amount}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category">
            Category <span className="required">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">
            Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            disabled={isSubmitting}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && (
            <span className="error-message">{errors.date}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Description <span className="required">*</span>
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What did you spend on?"
          maxLength="500"
          disabled={isSubmitting}
          className={errors.description ? 'error' : ''}
        />
        {errors.description && (
          <span className="error-message">{errors.description}</span>
        )}
        <small className="char-count">
          {formData.description.length}/500 characters
        </small>
      </div>

      {errors.submit && (
        <div className="error-banner">{errors.submit}</div>
      )}

      <button 
        type="submit" 
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </button>

      {createExpenseMutation.isSuccess && (
        <div className="success-message">
          ✓ Expense added successfully!
        </div>
      )}
    </form>
  );
}

export default ExpenseForm;
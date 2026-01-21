import React from 'react';
import './ExpenseFilter.css';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' }
];

function ExpenseFilters({ filters, onFilterChange }) {
  const handleCategoryChange = (e) => {
    onFilterChange({
      ...filters,
      category: e.target.value
    });
  };

  const handleSortChange = (e) => {
    onFilterChange({
      ...filters,
      sortByDateDesc: e.target.checked
    });
  };

  return (
    <div className="expense-filters">
      <div className="filter-group">
        <label htmlFor="category-filter">Filter by category:</label>
        <select
          id="category-filter"
          value={filters.category}
          onChange={handleCategoryChange}
          className="filter-select"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.sortByDateDesc}
            onChange={handleSortChange}
          />
          <span>Sort by date (newest first)</span>
        </label>
      </div>
    </div>
  );
}

export default ExpenseFilters;
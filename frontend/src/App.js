import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseFilters from './components/ExpenseFilter';
import './App.css';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
    }
  }
});

function App() {
  const [filters, setFilters] = useState({
    category: '',
    sortByDateDesc: false
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <header className="App-header">
          <h1>💰 Expense Tracker</h1>
          <p className="subtitle">Track your personal expenses</p>
        </header>

        <main className="App-main">
          <div className="container">
            <section className="form-section">
              <h2>Add New Expense</h2>
              <ExpenseForm />
            </section>

            <section className="list-section">
              <h2>Your Expenses</h2>
              <ExpenseFilters 
                filters={filters} 
                onFilterChange={setFilters} 
              />
              <ExpenseList filters={filters} />
            </section>
          </div>
        </main>

        <footer className="App-footer">
          <p>Built with focus on correctness and reliability</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
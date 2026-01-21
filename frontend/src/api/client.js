import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * API client for expense operations
 */
const expenseApi = {
  /**
   * Create a new expense
   * @param {Object} data - Expense data
   * @returns {Promise<Object>} Created expense
   */
  createExpense: async (data) => {
    // Generate idempotency key
    const idempotencyKey = uuidv4();
    
    const response = await apiClient.post('/expenses', data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
    
    return response.data;
  },

  /**
   * List expenses with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of expenses with total
   */
  listExpenses: async (params = {}) => {
    const queryParams = {};
    
    if (params.category) {
      queryParams.category = params.category;
    }
    
    if (params.sortByDateDesc) {
      queryParams.sort = 'date_desc';
    }
    
    const response = await apiClient.get('/expenses', {
      params: queryParams
    });
    
    return response.data;
  }
};

export { apiClient, expenseApi };
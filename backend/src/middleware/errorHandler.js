/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('duplicate')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'An unexpected error occurred';
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = {
  errorHandler
};
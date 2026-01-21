const { pool } = require('../db/database');

/**
 * Idempotency middleware to prevent duplicate request processing
 * Uses the Idempotency-Key header to cache responses
 */
async function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.get('Idempotency-Key');

  // Require idempotency key for POST requests
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: 'Idempotency-Key header is required' 
    });
  }

  // Validate idempotency key format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return res.status(400).json({ 
      error: 'Idempotency-Key must be a valid UUID' 
    });
  }

  const client = await pool.connect();
  
  try {
    // Check if we've seen this key before
    const result = await client.query(
      'SELECT response_data, status_code FROM idempotency_keys WHERE key = $1',
      [idempotencyKey]
    );

    if (result.rows.length > 0) {
      // Return cached response
      const cached = result.rows[0];
      console.log(`Idempotency key hit: ${idempotencyKey}`);
      return res.status(cached.status_code).json(cached.response_data);
    }

    // New request - add method to cache the response
    req.cacheIdempotentResponse = async (statusCode, responseData) => {
      try {
        await client.query(
          `INSERT INTO idempotency_keys (key, response_data, status_code)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO NOTHING`,
          [idempotencyKey, JSON.stringify(responseData), statusCode]
        );
      } catch (error) {
        console.error('Error caching idempotent response:', error);
        // Don't fail the request if caching fails
      }
    };

    next();
  } catch (error) {
    console.error('Error in idempotency middleware:', error);
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  idempotencyMiddleware
};
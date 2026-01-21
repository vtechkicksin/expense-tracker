const { pool } = require('../db/database');
const Redis = require('ioredis');

// Connect Redis using env
const redis = new Redis(process.env.REDIS_URL);

async function idempotencyMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header is required' });

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(key)) return res.status(400).json({ error: 'Idempotency-Key must be a valid UUID' });

  try {
    // Check Redis cache first
    const cached = await redis.get(key);
    if (cached) {
      const { statusCode, data } = JSON.parse(cached);
      console.info(`[Idempotency Hit - Redis] ${key}`);
      return res.status(statusCode).json(data);
    }

    // Fallback to Postgres
    const { rows } = await pool.query(
      'SELECT response_data, status_code FROM idempotency_keys WHERE key = $1',
      [key]
    );

    if (rows.length > 0) {
      const cachedRow = rows[0];
      await redis.set(key, JSON.stringify({ statusCode: cachedRow.status_code, data: cachedRow.response_data }), 'EX', 60*60*24);
      console.info(`[Idempotency Hit - Postgres] ${key}`);
      return res.status(cachedRow.status_code).json(cachedRow.response_data);
    }

    // Attach caching function
    req.cacheIdempotentResponse = async (statusCode, data) => {
      const payload = JSON.stringify({ statusCode, data });
      await redis.set(key, payload, 'EX', 60*60*24); // 24h TTL
      await pool.query(
        `INSERT INTO idempotency_keys (key, response_data, status_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(data), statusCode]
      );
    };

    next();
  } catch (err) {
    console.error('[Idempotency Middleware Error]', err);
    next(err);
  }
}

module.exports = { idempotencyMiddleware };

const { pool } = require('../db/database');
// Optional: const Redis = require('ioredis');
// const redis = new Redis(process.env.REDIS_URL);

async function idempotencyMiddleware(req, res, next) {
  // Only apply to POST, PUT, PATCH
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header is required' });

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(key)) return res.status(400).json({ error: 'Idempotency-Key must be a valid UUID' });

  try {
    // 1️⃣ Check Redis first (fast, optional)
    // const cached = await redis.get(key);
    // if (cached) return res.status(JSON.parse(cached).statusCode).json(JSON.parse(cached).data);

    // 2️⃣ Check Postgres
    const { rows } = await pool.query(
      'SELECT response_data, status_code FROM idempotency_keys WHERE key = $1',
      [key]
    );

    if (rows.length > 0) {
      const cached = rows[0];
      console.info(`[Idempotency Hit] ${key}`);
      return res.status(cached.status_code).json(cached.response_data);
    }

    // 3️⃣ Attach a safe caching function to req
    req.cacheIdempotentResponse = async (statusCode, data) => {
      try {
        // 3a: Write to Postgres asynchronously
        await pool.query(
          `INSERT INTO idempotency_keys (key, response_data, status_code)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO NOTHING`,
          [key, JSON.stringify(data), statusCode]
        );

        // 3b: Optional: write to Redis for faster future reads
        // await redis.set(key, JSON.stringify({ statusCode, data }), 'EX', 60 * 60 * 24); // 24h TTL
      } catch (err) {
        console.error(`[Idempotency Cache Error] ${key}`, err);
      }
    };

    next();
  } catch (err) {
    console.error('[Idempotency Middleware Error]', err);
    // Pass error to global handler
    next(err);
  }
}

module.exports = { idempotencyMiddleware };

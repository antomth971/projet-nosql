import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MongoClient } from 'mongodb'
import { createClient, commandOptions } from 'redis'
import { gzipSync, gunzipSync } from 'zlib'
import 'dotenv/config'

const app = new Hono()

// MongoDB
const mongo = new MongoClient(process.env.MONGO_URI!)
await mongo.connect()
const db = mongo.db('travelhub')
const offers = db.collection('offers')

// Redis
const redis = createClient({ url: process.env.REDIS_URL })
await redis.connect()

app.get('/offers', async (c) => {
  const t0 = Date.now()
  try {
    const from = c.req.query('from')
    const to = c.req.query('to')
    const limit = Number(c.req.query('limit') ?? 10)

    if (!from || !to) return c.json({ error: 'from and to required' }, 400)
    console.log(to, from, limit);
    
    const key = `offers:${from}:${to}:${limit}`
    // cache hit
    const cached = await redis.get(
      commandOptions({ returnBuffers: true }),
      key
    )
    if (cached) {
      console.log(`[GET /offers] hit ${Date.now() - t0}ms`)
      return c.json(JSON.parse(gunzipSync(cached).toString()))
    }

    // Mongo query
    const docs = await offers
      .find({ from, to })
      .sort({ price: 1 })
      .limit(limit)
      .toArray()

    // store in cache
    await redis.set(key, gzipSync(Buffer.from(JSON.stringify(docs))), { EX: 60 })

    console.log(`[GET /offers] miss ${Date.now() - t0}ms`)
    return c.json(docs)
  } catch (e) {
    console.error(e)
    console.log(`[GET /offers] error ${Date.now() - t0}ms`)
    return c.json({ error: 'internal error' }, 500)
  }
})

serve({ fetch: app.fetch, port: 3000 }, (info) =>
  console.log(`Server is running on http://localhost:${info.port}`)
)

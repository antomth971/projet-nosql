import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MongoClient } from 'mongodb'
import { createClient, commandOptions } from 'redis'
import { gzipSync, gunzipSync } from 'zlib'
import neo4j from 'neo4j-driver'
import 'dotenv/config'
import { v4 as uuid } from 'uuid'

const app = new Hono()

// MongoDB
console.log(process.env.MONGO_URI);

const mongo = new MongoClient(process.env.MONGO_URI!)
await mongo.connect()
const db = mongo.db('travelhub')
const offers = db.collection('offers')

// Redis
const redis = createClient({ url: process.env.REDIS_URL })
await redis.connect()

//neo4j
const neo = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
)


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

app.get('/reco', async c => {
  const city = c.req.query('city')
  const k = parseInt(c.req.query('k') ?? '3', 10)
  if (!city) return c.json({ error: 'city required' }, 400)

  const session = neo.session({ defaultAccessMode: neo4j.session.READ })
  try {
    const res = await session.run(
      `MATCH (c:City {code:$city})- [r:NEAR]-> (n:City)
   RETURN n.code AS city, r.weight AS score
   ORDER BY score DESC
   LIMIT $k`,
      { city, k: neo4j.int(k) }
    )

    const data = res.records.map(r => ({
      city: r.get('city') as string,
      score: r.get('score') as number
    }))
    return c.json(data)
  } finally {
    await session.close()
  }
})

app.post('/login', async c => {
  let body: { userId?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'body must be valid JSON' }, 400)
  }

  const userId = body.userId
  if (!userId) return c.json({ error: 'userId required' }, 400)

  const token = uuid()
  await redis.set(`session:${token}`, userId, { EX: 900 })

  return c.json({ token, expires_in: 900 })
})


serve({ fetch: app.fetch, port: 3000 }, (info) =>
  console.log(`Server is running on http://localhost:${info.port}`)
)

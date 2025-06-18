import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { MongoClient, ObjectId } from 'mongodb'
import { createClient, commandOptions } from 'redis'
import { gzipSync, gunzipSync } from 'zlib'
import neo4j from 'neo4j-driver'
import 'dotenv/config'
import { v4 as uuid } from 'uuid'

const app = new Hono()

//add CORS headers

app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const dur = Date.now() - start
  if (!c.res.headers.get('Content-Type')) {
    c.res.headers.set('Content-Type', 'application/json; charset=utf-8')
  }
  c.res.headers.set('X-Response-Time', `${dur}ms`)
})


// MongoDB
console.log(process.env.MONGO_URI);

const mongo = new MongoClient(process.env.MONGO_URI!)
await mongo.connect()
const db = mongo.db('travelhub')
const offers = db.collection('offers')

// indexes
await offers.createIndex({ from: 1, to: 1, price: 1 })
await offers.createIndex({ provider: 'text' })

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

    if (!from || !to) return c.json(await offers.find().toArray())
    console.log(to, from, limit);

    const key = `offers:${from}:${to}:${limit}`
    // cache hit
    const cached = await redis.get(
      commandOptions({ returnBuffers: true }),
      key
    )
    if (cached) {
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

app.get('/offers/:id', async c => {
  const t0 = Date.now()
  const id = c.req.param('id')
  if (!ObjectId.isValid(id)) return c.json({ error: 'invalid id' }, 400)

  const cacheKey = `offers:${id}`
  // cache hit
  const cached = await redis.get(commandOptions({ returnBuffers: true }), cacheKey)
  if (cached) {
    console.log(`[GET /offers/${id}] hit ${Date.now() - t0}ms`)
    return c.json(JSON.parse(gunzipSync(cached).toString()))
  }

  const offer = await offers.findOne({ _id: new ObjectId(id) })
  if (!offer) return c.json({ error: 'not found' }, 404)

  const session = neo.session({ defaultAccessMode: neo4j.session.READ })
  const near = await session.run(
    `MATCH (c:City {code:$code})- [r:NEAR]-> (n:City)
     RETURN n.code AS city
     ORDER BY r.weight DESC
     LIMIT 3`,
    { code: offer.to }
  )
  await session.close()
  const nearCodes = near.records.map(r => r.get('city')) as string[]

  const relatedDocs = await offers.find({ from: offer.from, to: { $in: nearCodes }, date: offer.date }, { projection: { _id: 1 } }).limit(3).toArray()
  const relatedOffers = relatedDocs.map(o => o._id.toString())
  const full = { ...offer, relatedOffers }

  await redis.set(cacheKey, gzipSync(Buffer.from(JSON.stringify(full))), { EX: 300 })
  console.log(`[GET /offers/${id}] miss ${Date.now() - t0}ms`)
  return c.json(full)
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
    const data = res.records.map(r => ({ city: r.get('city') as string, score: r.get('score') as number }))
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


app.get('/offers/:id', async c => {
  const t0 = Date.now()
  const id = c.req.param('id')
  if (!ObjectId.isValid(id)) return c.json({ error: 'invalid id' }, 400)

  const cacheKey = `offers:${id}`
  const cached = await redis.get(commandOptions({ returnBuffers: true }), cacheKey)
  if (cached) {
    console.log(`[GET /offers/${id}] hit ${Date.now() - t0}ms`)
    return c.json(JSON.parse(gunzipSync(cached).toString()))
  }

  const offer = await offers.findOne({ _id: new ObjectId(id) })
  if (!offer) return c.json({ error: 'not found' }, 404)

  const session = neo.session({ defaultAccessMode: neo4j.session.READ })
  const near = await session.run(
    `MATCH (c:City {code:$code})- [r:NEAR]-> (n:City)
     RETURN n.code AS city
     ORDER BY r.weight DESC
     LIMIT 3`,
    { code: offer.to }
  )
  await session.close()
  const nearCodes = near.records.map(r => r.get('city'))

  const related = await offers
    .find({ from: offer.from, to: { $in: nearCodes } }, { projection: { _id: 1 } })
    .limit(3)
    .toArray()

  const full = { ...offer, relatedOffers: related.map(o => o._id.toString()) }
  await redis.set(cacheKey, gzipSync(Buffer.from(JSON.stringify(full))), { EX: 300 })
  console.log(`[GET /offers/${id}] miss ${Date.now() - t0}ms`)
  return c.json(full)
})

app.post('/offers', async c => {
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'body must be valid JSON' }, 400)
  }

  const { from, to, price, currency, provider, ...rest } = body
  const required = { from, to, price, currency, provider }
  for (const [k, v] of Object.entries(required)) {
    if (v === undefined || v === null || v === '') return c.json({ error: `${k} required` }, 400)
  }

  const doc = { from, to, price, currency, provider, ...rest }
  const result = await offers.insertOne(doc)
  const offerId = result.insertedId.toString()

  await redis.publish('offers:new', JSON.stringify({ offerId, from, to }))

  return c.json({ _id: offerId, ...doc })
})

serve({ fetch: app.fetch, port: 3000 }, info => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

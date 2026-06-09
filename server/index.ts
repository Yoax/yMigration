import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedIfEmpty } from './seed.js'
import { geocodeRouter } from './routes/geocode.js'
import { routingRouter } from './routes/routing.js'
import { personsRouter } from './routes/persons.js'
import { journeysRouter } from './routes/journeys.js'
import { dataRouter } from './routes/data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const distPath = join(__dirname, '..', 'dist')

seedIfEmpty()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/geocode', geocodeRouter)
app.use('/api/route', routingRouter)
app.use('/api/persons', personsRouter)
app.use('/api/journeys', journeysRouter)
app.use('/api/data', dataRouter)

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`API yMigration : http://localhost:${PORT}`)
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(__dirname, 'public/data')
const ALLOWED = new Set([
  'texts',
  'words',
  'encounters',
  'quiz_results',
  'vocab_baseline',
])

function dataApi() {
  return {
    name: 'data-api',
    configureServer(server: any) {
      server.middlewares.use('/api/data', async (req: any, res: any) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const name = url.pathname.replace(/^\/+/, '').replace(/\.json$/, '')
          if (!ALLOWED.has(name)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'unknown file' }))
            return
          }
          const filepath = path.join(DATA_DIR, `${name}.json`)

          if (req.method === 'GET') {
            const content = await fs.readFile(filepath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(content)
            return
          }

          if (req.method === 'PUT') {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk)
            const body = Buffer.concat(chunks).toString('utf-8')
            JSON.parse(body)
            await fs.writeFile(filepath, body)
            res.statusCode = 204
            res.end()
            return
          }

          res.statusCode = 405
          res.end()
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

// GitHub Pages subpath. Change to '/' if deploying to root (e.g. custom domain).
const BASE = process.env.VITE_BASE ?? '/spanish-reader/'

export default defineConfig({
  base: BASE,
  plugins: [react(), dataApi()],
  server: { port: 5173 },
})

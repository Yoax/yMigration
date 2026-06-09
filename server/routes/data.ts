import { Router } from 'express'
import { clearAllData } from '../db.js'
import {
  applyImport,
  buildExport,
  exportFilename,
  parseImportPayload,
  type ImportMode,
} from '../utils/dataTransfer.js'

export const dataRouter = Router()

dataRouter.get('/export', (_req, res) => {
  const payload = buildExport()
  const filename = exportFilename()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.json(payload)
})

dataRouter.post('/reset', (_req, res) => {
  clearAllData()
  res.json({ ok: true })
})

dataRouter.post('/import', (req, res) => {
  const body = req.body as { data?: unknown; mode?: ImportMode }
  const mode = body.mode === 'merge' ? 'merge' : 'replace'

  if (!body.data) {
    res.status(400).json({ error: 'Corps de requête invalide : data requis' })
    return
  }

  try {
    const payload = parseImportPayload(body.data)
    const result = applyImport(payload, mode)
    res.json({
      ok: true,
      mode,
      ...result,
      exportedAt: payload.exportedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import impossible'
    res.status(400).json({ error: message })
  }
})

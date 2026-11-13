export class AppError extends Error {
  constructor(status, message, code) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

export const notFound = (req, res) => res.status(404).json({ error: 'Not found' })

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code })
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' })
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' })
  console.error('[error]', err)
  res.status(500).json({ error: 'Server error' })
}

// Lets async controllers throw without try/catch.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

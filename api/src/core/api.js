import match from '../processing/match.js'

import { internalStream } from '../stream/internal.js'
import stream from '../stream/types.js'

import { env } from '../config.js'
import { createResponse, normalizeRequest } from '../processing/request.js'
import { extract } from '../processing/url.js'
import { getInternalStream, verifyStream } from '../stream/manage.js'

const fail = (res, code, context) => {
  const { status, body } = createResponse('error', { code, context })
  res.status(status).json(body)
}

export const runAPI = (express, app, __dirname) => {
  app.use('/', express.json({ limit: 1024 }))

  app.post('/', async (req, res) => {
    const request = req.body
    if (!request.url) return fail(res, 'error.api.link.missing')
    const { success, data: normalizedRequest } = await normalizeRequest(request)
    if (!success) return fail(res, 'error.api.invalid_body')
    const parsed = extract(normalizedRequest.url)
    if (!parsed) return fail(res, 'error.api.link.invalid')

    if ('error' in parsed) {
      let context
      if (parsed?.context) context = parsed.context
      return fail(res, `error.api.${parsed.error}`, context)
    }

    try {
      const result = await match({
        host: parsed.host,
        patternMatch: parsed.patternMatch,
        params: normalizedRequest,
      })
      res.status(result.status).json(result.body)
    } catch {
      fail(res, 'error.api.generic')
    }
  })

  app.get('/tunnel', (req, res) => {
    const id = String(req.query.id)
    const exp = String(req.query.exp)
    const sig = String(req.query.sig)
    const sec = String(req.query.sec)
    const iv = String(req.query.iv)
    const streamInfo = verifyStream(id, sig, exp, sec, iv)
    return stream.proxy(streamInfo, res)
  })

  app.get('/itunnel', (req, res) => {
    const streamInfo = getInternalStream(req.query.id)
    return internalStream(streamInfo, res)
  })

  app.use((_, __, res, ___) => fail(res, 'error.api.generic'))

  app.listen(env.apiPort, env.listenAddress, () => console.log(`Server started: ${env.apiURL}`))
}

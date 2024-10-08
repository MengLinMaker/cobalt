import match from '../processing/match.js'
import stream from '../stream/stream.js'

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

    const checkQueries = id && exp && sig && sec && iv
    const checkBaseLength = id.length === 21 && exp.length === 13
    const checkSafeLength = sig.length === 43 && sec.length === 43 && iv.length === 22

    if (!checkQueries || !checkBaseLength || !checkSafeLength) return res.status(400).end()
    if (req.query.p) return res.status(200).end()
    const streamInfo = verifyStream(id, sig, exp, sec, iv)
    if (!streamInfo?.service) return res.status(streamInfo.status).end()
    if (streamInfo.type === 'proxy') streamInfo.range = req.headers.range

    return stream(res, streamInfo)
  })

  app.get('/itunnel', (req, res) => {
    if (!req.ip.endsWith('127.0.0.1')) return res.sendStatus(403)
    if (String(req.query.id).length !== 21) return res.sendStatus(400)

    const streamInfo = getInternalStream(req.query.id)
    if (!streamInfo) return res.sendStatus(404)
    streamInfo.headers = new Map([...(streamInfo.headers || []), ...Object.entries(req.headers)])

    return stream(res, { type: 'internal', ...streamInfo })
  })

  app.use((_, __, res, ___) => fail(res, 'error.api.generic'))

  app.listen(env.apiPort, env.listenAddress, () => console.log(`Server started: ${env.apiURL}`))
}

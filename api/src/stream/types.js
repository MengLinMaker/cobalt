import { create as contentDisposition } from 'content-disposition-header'
import { request } from 'undici'
import { destroyInternalStream } from './manage.js'
import { closeRequest, closeResponse, getHeaders, pipe } from './shared.js'


const proxy = async (streamInfo, res) => {
  const abortController = new AbortController()
  const shutdown = () => {
    closeRequest(abortController)
    closeResponse(res)
    return destroyInternalStream(streamInfo.urls)
  }

  try {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Content-disposition', contentDisposition(streamInfo.filename))

    const {
      body: stream,
      headers,
      statusCode,
    } = await request(streamInfo.urls, {
      headers: {
        ...getHeaders(streamInfo.service),
        Range: streamInfo.range,
      },
      signal: abortController.signal,
      maxRedirections: 16,
    })

    res.status(statusCode)

    for (const headerName of ['accept-ranges', 'content-type', 'content-length']) {
      if (headers[headerName]) {
        res.setHeader(headerName, headers[headerName])
      }
    }

    pipe(stream, res, shutdown)
  } catch {
    shutdown()
  }
}

export default {
  proxy,
}

import stream from './types.js'

import { internalStream } from './internal.js'
import { closeResponse } from './shared.js'

export default async function (res, streamInfo) {
  try {
    switch (streamInfo.type) {
      case 'proxy':
        return await stream.proxy(streamInfo, res)

      case 'internal':
        return internalStream(streamInfo, res)
    }
    closeResponse(res)
  } catch {
    closeResponse(res)
  }
}

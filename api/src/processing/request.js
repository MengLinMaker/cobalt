import { createStream } from '../stream/manage.js'
import { apiSchema } from './schema.js'

export function createResponse(responseType, responseData) {
  const internalError = (code) => {
    return {
      status: 500,
      body: {
        status: 'error',
        error: {
          code: code || 'error.api.fetch.critical',
        },
        critical: true,
      },
    }
  }

  try {
    let status = 200
    let response = {}

    if (responseType === 'error') {
      status = 400
    }

    switch (responseType) {
      case 'error':
        response = {
          error: {
            code: responseData?.code,
            context: responseData?.context,
          },
        }
        break

      case 'redirect':
        response = {
          url: responseData?.u,
          filename: responseData?.filename,
        }
        break

      case 'tunnel':
        response = {
          url: createStream(responseData),
          filename: responseData?.filename,
        }
        break

      case 'picker':
        response = {
          picker: responseData?.picker,
          audio: responseData?.u,
          audioFilename: responseData?.filename,
        }
        break

      case 'critical':
        return internalError(responseData?.code)

      default:
        throw 'unreachable'
    }

    return {
      status,
      body: {
        status: responseType,
        ...response,
      },
    }
  } catch {
    return internalError()
  }
}

export function normalizeRequest(request) {
  return apiSchema.safeParseAsync(request).catch(() => ({ success: false }))
}

import 'dotenv/config'

import express from 'express'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { env } from './config.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename).slice(0, -4)

app.disable('x-powered-by')

if (env.apiURL) {
  const { runAPI } = await import('./core/api.js')
  runAPI(express, app, __dirname)
} else {
  console.log('Please run the setup script: npm run setup')
}

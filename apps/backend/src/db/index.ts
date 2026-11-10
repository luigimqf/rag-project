import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../lib/env.js'

export const db = drizzle(env.DB_URL)
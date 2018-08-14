import { keyBy, mapValues } from 'lodash'
import { Pool } from 'pg'
import config from './config'

const { postgres: pgConfig } = config
const pool = new Pool(pgConfig)

// TODO set base increment to all task tickers in asana
const TICKER_SHIFT = 1400

export const getOrSetTaskTicker = async taskId => {
  const client = await pool.connect()

  try {
    const {
      rows,
    } = await client.query(
      'SELECT task_id, id from asana_task_id where task_id=$1',
      [taskId]
    )

    if (rows.length) {
      return rows[0].id + TICKER_SHIFT
    }

    const {
      rows: [{ id }],
    } = await client.query(
      'INSERT INTO asana_task_id (task_id) VALUES ($1) RETURNING *',
      [taskId]
    )

    return id + TICKER_SHIFT
  } finally {
    client.release()
  }
}

export const getAsanaTaskIdByTicker = async number => {
  const client = await pool.connect()
  try {
    const {
      rows,
    } = await client.query('SELECT task_id from asana_task_id where id=$1', [
      number,
    ])

    if (rows.length) {
      return rows[0].task_id
    }
  } finally {
    client.release()
  }
}

/*
  Returns map of task tickers {task_id: ticker}
 */
export const getTaskTickers = async () => {
  const client = await pool.connect()

  try {
    const { rows } = await client.query('SELECT task_id, id from asana_task_id')

    return mapValues(keyBy(rows, 'task_id'), row => row.id)
  } finally {
    client.release()
  }
}

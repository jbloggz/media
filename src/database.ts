/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * PostgreSQL database connection pool
 */

import { Pool } from 'pg';

const db = new Pool();

export default db;

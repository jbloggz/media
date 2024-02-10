/**
 * MIT License
 *
 * Copyright (c) 2024 Josef Barnes
 *
 * PostgreSQL database connection pool
 */

import { Pool } from 'pg';

const db = new Pool();

export default db;

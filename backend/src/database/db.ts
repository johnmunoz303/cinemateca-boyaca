import {Pool} from 'pg';
const globalDb=globalThis as unknown as {pool?:Pool};
export const db=globalDb.pool??new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000});
globalDb.pool=db;

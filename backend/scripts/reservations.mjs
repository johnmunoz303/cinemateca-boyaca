import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
while(true){const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query("UPDATE reservas SET estado='expirada' WHERE estado='pendiente' AND expiracion<=now() RETURNING id");if(r.rowCount)await c.query('UPDATE reservas_asientos SET activo=false WHERE reserva_id=ANY($1::uuid[])',[r.rows.map(x=>x.id)]);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');console.error('Reservas:',e.message)}finally{c.release()}await new Promise(r=>setTimeout(r,2000))}

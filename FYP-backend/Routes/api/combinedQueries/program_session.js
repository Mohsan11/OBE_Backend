const express = require("express");
const { pool } = require("../../../db"); 
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Function to create program and session in a transaction
async function createProgramAndSession(program, session) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const programQueryText = 'INSERT INTO programs (name, code) VALUES ($1, $2) RETURNING *';
    const programValues = [program.name, program.code];
    const programResult = await client.query(programQueryText, programValues);

    const sessionQueryText = 'INSERT INTO sessions (start_year, end_year) VALUES ($1, $2) RETURNING *';
    const sessionValues = [session.start_year, session.end_year];
    const sessionResult = await client.query(sessionQueryText, sessionValues);

    await client.query('COMMIT');
    return { program: programResult.rows[0], session: sessionResult.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Express route handler
router.post("/", async (req, res) => {
  const { program, session } = req.body;
  try {
    const result = await createProgramAndSession(program, session);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

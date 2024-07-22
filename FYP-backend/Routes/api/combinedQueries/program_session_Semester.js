const express = require("express");
const { pool } = require("../../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { program, session, semester } = req.body;

    // Insert into programs table
    const programQuery = 'INSERT INTO programs (name) VALUES ($1) RETURNING id';
    const programResult = await client.query(programQuery, [program.name]);
    const programId = programResult.rows[0].id;

    // Insert into sessions table
    const sessionQuery = 'INSERT INTO sessions (start_year, end_year, program_id) VALUES ($1, $2, $3) RETURNING id';
    const sessionResult = await client.query(sessionQuery, [session.start_year, session.end_year, programId]);
    const sessionId = sessionResult.rows[0].id;

    // Insert into semesters table
    const semesterQuery = 'INSERT INTO semesters (name, number, session_id) VALUES ($1, $2, $3) RETURNING *';
    const semesterResult = await client.query(semesterQuery, [semester.name, semester.number, sessionId]);

    await client.query('COMMIT');
    res.status(201).json(semesterResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;

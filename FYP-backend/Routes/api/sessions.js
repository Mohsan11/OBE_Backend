const express = require("express");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

// Helper function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for sessions table
async function createSession(session) {
  const { start_year, end_year } = session;
  const queryText =
    'INSERT INTO sessions (start_year, end_year) VALUES ($1, $2) RETURNING *';
  const values = [start_year, end_year];
  return query(queryText, values);
}

async function getSession(sessionId) {
  const queryText = 'SELECT * FROM sessions WHERE id = $1';
  return query(queryText, [sessionId]);
}

async function updateSession(sessionId, updates) {
  const { start_year, end_year } = updates;
  const queryText =
    'UPDATE sessions SET start_year = $1, end_year = $2 WHERE id = $3 RETURNING *';
  const values = [start_year, end_year, sessionId];
  return query(queryText, values);
}

async function deleteSession(sessionId) {
  const queryText = 'DELETE FROM sessions WHERE id = $1';
  return query(queryText, [sessionId]);
}

async function getAllSessions() {
  const queryText = 'SELECT * FROM sessions';
  return query(queryText, []);
}

// Express route handlers
router.get("/all", async (req, res) => {
  try {
    const result = await getAllSessions();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await createSession(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getSession(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateSession(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteSession(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

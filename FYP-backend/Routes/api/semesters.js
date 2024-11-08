const express = require("express");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for semesters table
async function createSemester(semester) {
  const { name, number, session_id } = semester;
  const queryText = 'INSERT INTO semesters (name, number, session_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, number, session_id];
  return query(queryText, values);
}

async function getSemester(semesterId) {
  const queryText = 'SELECT * FROM semesters WHERE id = $1';
  return query(queryText, [semesterId]);
}

async function updateSemester(semesterId, updates) {
  const { name, number, session_id } = updates;
  const queryText = 'UPDATE semesters SET name = $1, number = $2, session_id = $3 WHERE id = $4 RETURNING *';
  const values = [name, number, session_id, semesterId];
  return query(queryText, values);
}

async function deleteSemester(semesterId) {
  const queryText = 'DELETE FROM semesters WHERE id = $1';
  return query(queryText, [semesterId]);
}

async function getAllSemesters() {
  const queryText = 'SELECT * FROM semesters';
  return query(queryText, []);
}

// Express route handlers
router.get("/all", async (req, res) => {
  try {
    const result = await getAllSemesters();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await createSemester(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getSemester(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Semester not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateSemester(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Semester not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteSemester(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await query(`
      SELECT * FROM semesters WHERE session_id = $1
    `, [sessionId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function getAllSemesters() {
  const queryText = 'SELECT * FROM semesters';
  return query(queryText, []);
}

// Routes
router.get('/all', async (req, res) => {
  try {
    const result = await getAllSemesters();
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching semesters:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get('/:session_id', async (req, res) => {
  const { session_id } = req.query;
  try {
    const result = await query('SELECT * FROM semesters WHERE session_id = $1', [session_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;

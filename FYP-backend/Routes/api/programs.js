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

// CRUD functions for programs table
async function createProgram(program) {
  const { name, code } = program;
  const queryText =
    'INSERT INTO programs (name, code) VALUES ($1, $2) RETURNING *';
  const values = [name, code];
  return query(queryText, values);
}

async function getProgram(programId) {
  const queryText = 'SELECT * FROM programs WHERE id = $1';
  return query(queryText, [programId]);
}

async function updateProgram(programId, updates) {
  const { name, code } = updates;
  const queryText =
    'UPDATE programs SET name = $1, code = $2 WHERE id = $3 RETURNING *';
  const values = [name, code, programId];
  return query(queryText, values);
}

async function deleteProgram(programId) {
  const queryText = 'DELETE FROM programs WHERE id = $1';
  return query(queryText, [programId]);
}

async function getAllPrograms() {
    const queryText = 'SELECT * FROM programs';
    return query(queryText, []);
  }
    
  // Express route handlers
  
  router.get("/all", async (req, res) => {
    try {
      const result = await getAllPrograms();
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/", async (req, res) => {
  try {
    const result = await createProgram(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getProgram(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Program not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateProgram(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Program not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteProgram(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

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

// CRUD functions for plos table
async function createPLO(plo) {
  const { description, program_id, session_id, plo_name } = plo;

  // Check if a PLO with the same name, program, and session exists
  const existingPLOQuery = 'SELECT * FROM plos WHERE plo_name = $1 AND program_id = $2 AND session_id = $3';
  const existingPLO = await query(existingPLOQuery, [plo_name, program_id, session_id]);

  if (existingPLO.rows.length > 0) {
    throw new Error('PLO with the same name already exists for this program and session.');
  }

  const queryText = 'INSERT INTO plos (description, program_id, session_id, plo_name) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [description, program_id, session_id, plo_name];
  return query(queryText, values);
}


async function getPLO(ploId) {
  const queryText = 'SELECT * FROM plos WHERE id = $1';
  return query(queryText, [ploId]);
}

async function updatePLO(ploId, updates) {
  const { description, program_id, session_id, plo_name } = updates;
  const queryText = 'UPDATE plos SET description = $1, program_id = $2, session_id = $3, plo_name = $4 WHERE id = $5 RETURNING *';
  const values = [description, program_id, session_id, plo_name, ploId];
  return query(queryText, values);
}

async function deletePLO(ploId) {
  const queryText = 'DELETE FROM plos WHERE id = $1';
  return query(queryText, [ploId]);
}

async function getAllPLOs() {
  const queryText = `
    SELECT p.id, p.description, p.program_id, p.session_id, p.plo_name, pr.name as program_name
    FROM plos p
    JOIN programs pr ON p.program_id = pr.id
  `;
  return query(queryText, []);
}

// Routes
router.get('/all', async (req, res) => {
  try {
    const result = await getAllPLOs();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await createPLO(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getPLO(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updatePLO(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deletePLO(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

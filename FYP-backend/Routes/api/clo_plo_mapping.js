const express = require("express");
const { pool } = require("../../db");
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for clo_plo_mapping table
async function createMapping(mapping) {
  const { clo_id, plo_id } = mapping;
  const queryText = 'INSERT INTO clo_plo_mapping (clo_id, plo_id) VALUES ($1, $2) RETURNING *';
  const values = [clo_id, plo_id];
  return query(queryText, values);
}

async function getMapping(clo_id, plo_id) {
  const queryText = 'SELECT * FROM clo_plo_mapping WHERE clo_id = $1 AND plo_id = $2';
  return query(queryText, [clo_id, plo_id]);
}

async function deleteMapping(clo_id, plo_id) {
  const queryText = 'DELETE FROM clo_plo_mapping WHERE clo_id = $1 AND plo_id = $2';
  return query(queryText, [clo_id, plo_id]);
}

async function getAllMappings() {
  const queryText = 'SELECT * FROM clo_plo_mapping';
  return query(queryText, []);
}

// Express routes
router.get("/all", async (req, res) => {
  try {
    const result = await getAllMappings();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new mapping
router.post("/", async (req, res) => {
  try {
    const result = await createMapping(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a mapping by CLO ID and PLO ID
router.get("/:clo_id/:plo_id", async (req, res) => {
  try {
    const result = await getMapping(req.params.clo_id, req.params.plo_id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a mapping by CLO ID and PLO ID
router.delete("/:clo_id/:plo_id", async (req, res) => {
  try {
    await deleteMapping(req.params.clo_id, req.params.plo_id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/api/getMappings', async (req, res) => {
  const { course, session, program } = req.query;

  let query = 'SELECT * FROM mappings WHERE 1=1';
  const queryParams = [];

  if (course && course !== 'All Courses') {
      queryParams.push(course);
      query += ` AND course = $${queryParams.length}`;
  }
  if (session && session !== 'All Sessions') {
      queryParams.push(session);
      query += ` AND session = $${queryParams.length}`;
  }
  if (program && program !== 'All Programs') {
      queryParams.push(program);
      query += ` AND program = $${queryParams.length}`;
  }

  try {
      const result = await pool.query(query, queryParams);
      res.json(result.rows);
  } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).send('Error executing query');
  }
});
module.exports = router;

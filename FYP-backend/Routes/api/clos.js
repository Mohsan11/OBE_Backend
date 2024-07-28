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

// CRUD functions for clos table
async function createCLO(clo) {
  const { description, course_id, session_id, clo_name } = clo;
  const queryText = 'INSERT INTO clos (description, course_id, session_id, clo_name) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [description, course_id, session_id, clo_name];
  return query(queryText, values);
}

async function getCLO(cloId) {
  const queryText = 'SELECT * FROM clos WHERE id = $1';
  return query(queryText, [cloId]);
}

async function updateCLO(cloId, updates) {
  const { description, course_id, session_id, clo_name } = updates;
  const queryText = 'UPDATE clos SET description = $1, course_id = $2, session_id = $3, clo_name = $4 WHERE id = $5 RETURNING *';
  const values = [description, course_id, session_id, clo_name, cloId];
  return query(queryText, values);
}

async function deleteCLO(cloId) {
  const queryText = 'DELETE FROM clos WHERE id = $1';
  return query(queryText, [cloId]);
}

async function getAllCLOs() {
  const queryText = 'SELECT * FROM clos';
  return query(queryText, []);
}
// Express route 
router.get("/all", async (req, res) => {
    try {
      const result = await getAllCLOs();
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Create a new CLO
  router.post("/", async (req, res) => {
    try {
      const result = await createCLO(req.body);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get a CLO by ID
  router.get("/:id", async (req, res) => {
    try {
      const result = await getCLO(req.params.id);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "CLO not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Update a CLO by ID
  router.put("/:id", async (req, res) => {
    try {
      const result = await updateCLO(req.params.id, req.body);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "CLO not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Delete a CLO by ID
  router.delete("/:id", async (req, res) => {
    try {
      await deleteCLO(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  async function getClosByCourseId(courseId) {
    const queryText = `
      SELECT id, description, course_id, session_id, clo_name
      FROM clos
      WHERE course_id = $1
    `;
    const values = [courseId];
    return query(queryText, values);
  }
  
  // Route handler for fetching CLOs by course ID
  router.get('/course/:courseId', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const result = await getClosByCourseId(courseId);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching CLOs:', error);
      res.status(500).json({ message: 'Error fetching CLOs' });
    }
  });
  
  
  module.exports = router;
  
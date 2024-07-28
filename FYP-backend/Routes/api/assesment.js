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

// CRUD functions for assessments table
async function createAssessment(assessment) {
  const { assessment_name, assessment_type, course_id, semester_id } = assessment;
  const queryText = 'INSERT INTO assessments (assessment_name, assessment_type, course_id, semester_id) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [assessment_name, assessment_type, course_id, semester_id];
  return query(queryText, values);
}

async function getAssessment(assessmentId) {
  const queryText = 'SELECT * FROM assessments WHERE id = $1';
  return query(queryText, [assessmentId]);
}

async function updateAssessment(assessmentId, updates) {
  const { assessment_name, assessment_type } = updates;
  const queryText = 'UPDATE assessments SET assessment_name = $1, assessment_type = $2 WHERE id = $3 RETURNING *';
  const values = [assessment_name, assessment_type, assessmentId];
  return query(queryText, values);
}

async function deleteAssessment(assessmentId) {
  const queryText = 'DELETE FROM assessments WHERE id = $1';
  return query(queryText, [assessmentId]);
}

async function getAllAssessments() {
  const queryText = 'SELECT * FROM assessments';
  return query(queryText, []);
}

// Express route handlers
router.get("/all", async (req, res) => {
  try {
    const result = await getAllAssessments();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await createAssessment(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getAssessment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateAssessment(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteAssessment(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM assessments WHERE course_id = $1`,
      [courseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});


module.exports = router;

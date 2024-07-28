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

// CRUD functions for CourseOfferings table

// Get all course offerings
async function getAllCourseOfferings() {
  const queryText = `
    SELECT co.*, c.course_name, p.program_name, s.semester_name, ss.session
    FROM CourseOfferings co
    JOIN Courses c ON co.course_id = c.id
    JOIN Programs p ON co.program_id = p.id
    JOIN Semesters s ON co.semester_id = s.id
    JOIN Sessions ss ON co.session_id = ss.id
  `;
  return query(queryText, []);
}

// Create a new course offering
async function createCourseOffering(courseOffering) {
  const { course_id, semester_id, session_id, program_id } = courseOffering;
  const queryText = `
    INSERT INTO CourseOfferings (course_id, semester_id, session_id, program_id)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;
  const values = [course_id, semester_id, session_id, program_id];
  return query(queryText, values);
}

// Get a specific course offering by ID
async function getCourseOffering(id) {
  const queryText = `
    SELECT co.*, c.course_name, p.program_name, s.semester_name, ss.session
    FROM CourseOfferings co
    JOIN Courses c ON co.course_id = c.id
    JOIN Programs p ON co.program_id = p.id
    JOIN Semesters s ON co.semester_id = s.id
    JOIN Sessions ss ON co.session_id = ss.id
    WHERE co.id = $1
  `;
  return query(queryText, [id]);
}

// Update a course offering by ID
async function updateCourseOffering(id, updates) {
  const { course_id, semester_id, session_id, program_id } = updates;
  const queryText = `
    UPDATE CourseOfferings
    SET course_id = $1, semester_id = $2, session_id = $3, program_id = $4
    WHERE id = $5 RETURNING *
  `;
  const values = [course_id, semester_id, session_id, program_id, id];
  return query(queryText, values);
}

// Delete a course offering by ID
async function deleteCourseOffering(id) {
  const queryText = 'DELETE FROM CourseOfferings WHERE id = $1';
  return query(queryText, [id]);
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createCourseOffering(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const result = await getAllCourseOfferings();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status500.json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getCourseOffering(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course offering not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateCourseOffering(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course offering not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteCourseOffering(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch courses by program and session
router.get("/program/:programId/session/:sessionId", async (req, res) => {
  try {
    const { programId, sessionId } = req.params;
    const queryText = `
      SELECT co.*, c.course_name, p.program_name, s.semester_name, ss.session
      FROM CourseOfferings co
      JOIN Courses c ON co.course_id = c.id
      JOIN Programs p ON co.program_id = p.id
      JOIN Semesters s ON co.semester_id = s.id
      JOIN Sessions ss ON co.session_id = ss.id
      WHERE co.program_id = $1 AND co.session_id = $2
    `;
    const result = await query(queryText, [programId, sessionId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

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


// CRUD functions for courses table
async function getAllCourses() {
    const queryText = 'SELECT * FROM courses';
    return query(queryText, []);
  }
  

async function createCourse(course) {
  const { name, code, program_id } = course;
  const queryText =
    'INSERT INTO courses (name, code, program_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, code, program_id];
  return query(queryText, values);
}

async function getCourse(courseId) {
  const queryText = 'SELECT * FROM courses WHERE id = $1';
  return query(queryText, [courseId]);
}

async function updateCourse(courseId, updates) {
  const { name, code, program_id } = updates;
  const queryText =
    'UPDATE courses SET name = $1, code = $2, program_id = $3 WHERE id = $4 RETURNING *';
  const values = [name, code, program_id, courseId];
  return query(queryText, values);
}

async function deleteCourse(courseId) {
  const queryText = 'DELETE FROM courses WHERE id = $1';
  return query(queryText, [courseId]);
}

async function getTotalCourses() {
  const queryText = 'SELECT COUNT(*) FROM courses';
  const result = await query(queryText, []);
  return result.rows[0].count;
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createCourse(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 router.get("/all", async (req, res) => {
    try {
      const result = await getAllCourses();
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
router.get("/:id", async (req, res) => {
  try {
    const result = await getCourse(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateCourse(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteCourse(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/totalCourses", async (req, res) => {
  try {
    const count = await getTotalCourses();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;

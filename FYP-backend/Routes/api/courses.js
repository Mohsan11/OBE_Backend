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

async function getAllCourses() {
  const queryText = 'SELECT * FROM courses';
  return query(queryText, []);
}

async function createCourse(course) {
  const { name, code, program_id, semester_id, theory_credit_hours, lab_credit_hours } = course;
  const queryText = `
    INSERT INTO courses (name, code, program_id, semester_id, theory_credit_hours, lab_credit_hours)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [name, code, program_id, semester_id, theory_credit_hours, lab_credit_hours];
  return query(queryText, values);
}


async function getCourse(courseId) {
  const queryText = 'SELECT * FROM courses WHERE id = $1';
  return query(queryText, [courseId]);
}

async function updateCourse(courseId, updates) {
  const { name, code, program_id, semester_id, theory_credit_hours, lab_credit_hours } = updates;
  const queryText = `
    UPDATE courses 
    SET name = $1, code = $2, program_id = $3, semester_id = $4, theory_credit_hours = $5, lab_credit_hours = $6
    WHERE id = $7
    RETURNING *
  `;
  const values = [name, code, program_id, semester_id, theory_credit_hours, lab_credit_hours, courseId];
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

async function getCoursesByProgramAndSemester(programId, semesterId) {
  const queryText = `
    SELECT DISTINCT c.*, c.theory_credit_hours, c.lab_credit_hours
    FROM courses c
    JOIN programs p ON c.program_id = p.id
    JOIN sessions s ON p.id = s.program_id
    JOIN semesters sem ON s.id = sem.session_id
    WHERE p.id = $1 AND sem.id = $2;
  `;
  return query(queryText, [programId, semesterId]);
}


async function getAllCoursesDetailed() {
  const queryText = `
    SELECT 
      c.id, 
      c.name AS course_name, 
      c.code AS course_code, 
      c.theory_credit_hours, 
      c.lab_credit_hours, 
      p.name AS program_name, 
      s.start_year || ' - ' || s.end_year AS session, 
      sem.name AS semester_name, 
      sem.number AS semester_number
    FROM courses c
    JOIN programs p ON c.program_id = p.id
    JOIN semesters sem ON c.semester_id = sem.id
    JOIN sessions s ON sem.session_id = s.id
  `;
  return query(queryText, []);
}

async function getCoursesBySemester(semesterId) {
  const queryText = 'SELECT * FROM courses WHERE semester_id = $1';
  return query(queryText, [semesterId]);
}

// Express route handlers

// Route to get detailed course information
router.get("/allDetail", async (req, res) => {
  try {
    const result = await getAllCoursesDetailed();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Other CRUD routes
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
    if (err.code === '23503') { 
      res.status(400).json({ error: "Cannot delete course. It is referenced by other records." });
    } else {
      res.status(500).json({ error: err.message });
    }
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

router.get("/program/:programId", async (req, res) => {
  try {
    const programId = parseInt(req.params.programId);
    const result = await query('SELECT * FROM courses WHERE program_id = $1', [programId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/program/:programId/session/:sessionId", async (req, res) => {
  try {
    const { programId, sessionId } = req.params;
    const result = await query(`
      SELECT c.*, s.id AS semester_id, s.name AS semester_name, s.number AS semester_number
      FROM courses c
      JOIN semesters s ON c.program_id = $1 AND s.session_id = $2
      WHERE c.program_id = $1
    `, [programId, sessionId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/program/:programId/semester/:semesterId", async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    const result = await getCoursesByProgramAndSemester(programId, semesterId);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/semester/:semesterId", async (req, res) => {
  try {
    const { semesterId } = req.params;
    const result = await getCoursesBySemester(semesterId);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

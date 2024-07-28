const express = require("express");
const router = express.Router();
const { pool } = require("../../../db"); 

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}


async function getCoursesByTeacherAndSemester(teacher_id, semester_id) {
  const queryText = `
    SELECT tc.id, c.course_name, s.semester_name
    FROM teachercourseassignments tc
    JOIN courses c ON tc.course_id = c.id
    JOIN semesters s ON tc.semester_id = s.id
    WHERE tc.teacher_id = $1 AND tc.semester_id = $2
  `;
  return query(queryText, [teacher_id, semester_id]);
}

// Function to get all semesters
async function getAllSemesters() {
  const queryText = 'SELECT * FROM semesters';
  return query(queryText, []);
}

// Function to get all courses assigned to a teacher
async function getCoursesByTeacher(teacher_id) {
  const queryText = `
    SELECT tc.id, c.course_name, s.semester_name
    FROM teachercourseassignments tc
    JOIN courses c ON tc.course_id = c.id
    JOIN semesters s ON tc.semester_id = s.id
    WHERE tc.teacher_id = $1
  `;
  return query(queryText, [teacher_id]);
}

// Route to get courses assigned to a teacher for a specific semester
router.get("/courses/:teacher_id/:semester_id", async (req, res) => {
  const { teacher_id, semester_id } = req.params;
  try {
    const result = await getCoursesByTeacherAndSemester(teacher_id, semester_id);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to get all semesters
router.get("/semesters", async (req, res) => {
  try {
    const result = await getAllSemesters();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to get all courses assigned to a teacher
router.get("/courses/:teacher_id", async (req, res) => {
  const { teacher_id } = req.params;
  try {
    const result = await getCoursesByTeacher(teacher_id);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

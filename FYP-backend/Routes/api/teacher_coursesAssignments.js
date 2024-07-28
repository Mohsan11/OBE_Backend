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

// CRUD functions for teachercourseassignments table
async function createTeacherCourseAssignment(assignment) {
  const { teacher_id, course_id, semester_id } = assignment;
  const queryText = 'INSERT INTO teachercourseassignments (teacher_id, course_id, semester_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [teacher_id, course_id, semester_id];
  return query(queryText, values);
}

async function getTeacherCourseAssignment(id) {
  const queryText = 'SELECT * FROM teachercourseassignments WHERE id = $1';
  return query(queryText, [id]);
}

async function updateTeacherCourseAssignment(id, updates) {
  const { teacher_id, course_id, semester_id } = updates;
  const queryText = 'UPDATE teachercourseassignments SET teacher_id = $1, course_id = $2, semester_id = $3 WHERE id = $4 RETURNING *';
  const values = [teacher_id, course_id, semester_id, id];
  return query(queryText, values);
}

async function deleteTeacherCourseAssignment(id) {
  const queryText = 'DELETE FROM teachercourseassignments WHERE id = $1';
  return query(queryText, [id]);
}

async function getAllTeacherCourseAssignments() {
  const queryText = `
    SELECT * FROM teachercourseassignments
  `;
  return query(queryText, []);
}

// Fetch courses assigned to a specific teacher
// async function getCoursesByTeacherId(teacherId) {
//   const queryText = `
//     SELECT 
//       tc.course_id AS id, 
//       c.name AS course_name, 
//       p.name AS program_name, 
//       s.start_year || '-' || s.end_year AS session, 
//       sem.name AS semester_name
//     FROM 
//       teachercourseassignments tc
//       JOIN courses c ON tc.course_id = c.id
//       JOIN programs p ON c.program_id = p.id
//       JOIN semesters sem ON tc.semester_id = sem.id
//       JOIN sessions s ON sem.session_id = s.id
//     WHERE 
//       tc.teacher_id = $1
//   `;
//   return query(queryText, [teacherId]);
// }

// // Routes
// router.get('/teacher/:teacherId', async (req, res) => {
//   const { teacherId } = req.params;
//   try {
//     const result = await getCoursesByTeacherId(teacherId);
//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error("Error fetching courses:", err);
//     res.status(500).json({ error: err.message });
//   }
// });


router.get('/all', async (req, res) => {
  try {
    const result = await getAllTeacherCourseAssignments();
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error in /all route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await createTeacherCourseAssignment(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getTeacherCourseAssignment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching assignment:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateTeacherCourseAssignment(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating assignment:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteTeacherCourseAssignment(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ error: err.message });
  }
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

async function getCoursesByTeacherId(teacherId) {
  const queryText = `
    SELECT 
      tc.course_id AS id, 
      c.name AS course_name, 
      p.name AS program_name, 
      s.start_year || '-' || s.end_year AS session, 
      sem.name AS semester_name,
      sem.id AS semester_id
    FROM 
      teachercourseassignments tc
      JOIN courses c ON tc.course_id = c.id
      JOIN programs p ON c.program_id = p.id
      JOIN semesters sem ON tc.semester_id = sem.id
      JOIN sessions s ON sem.session_id = s.id
    WHERE 
      tc.teacher_id = $1
  `;
  return query(queryText, [teacherId]);
}

// Routes
router.get('/teacher/:teacherId', async (req, res) => {
  const { teacherId } = req.params;
  try {
    const result = await getCoursesByTeacherId(teacherId);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

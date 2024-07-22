const express = require("express");
const { pool } = require("../../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Fetch all students with program, session, and semester details
router.get("/all", async (req, res) => {
  try {
    const queryText = `
      SELECT 
        students.id, students.roll_number, students.student_name, students.email,
        programs.name AS program_name,
        sessions.start_year || '-' || sessions.end_year AS session_name,
        semesters.name || '-' || semesters.number AS semester_name
      FROM students
      LEFT JOIN programs ON students.program_id = programs.id
      LEFT JOIN sessions ON students.session_id = sessions.id
      LEFT JOIN semesters ON sessions.id = semesters.session_id;
    `;
    const result = await query(queryText);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

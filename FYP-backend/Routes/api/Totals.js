const express = require("express");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

// Function to execute SQL query
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Route to get total number of programs
router.get("/totalPrograms", async (req, res) => {
  try {
    const queryText = 'SELECT COUNT(*) AS total_programs FROM programs';
    const result = await query(queryText, []);
    const totalPrograms = result.rows[0].total_programs;
    res.status(200).json({ total_programs: totalPrograms });
  } catch (error) {
    console.error('Error fetching total programs:', error);
    res.status(500).json({ error: 'Error fetching total programs' });
  }
});

// Route to get total number of courses
router.get("/totalCourses", async (req, res) => {
  try {
    const queryText = 'SELECT COUNT(*) AS total_courses FROM courses';
    const result = await query(queryText, []);
    const totalCourses = result.rows[0].total_courses;
    res.status(200).json({ total_courses: totalCourses });
  } catch (error) {
    console.error('Error fetching total courses:', error);
    res.status(500).json({ error: 'Error fetching total courses' });
  }
});

module.exports = router;

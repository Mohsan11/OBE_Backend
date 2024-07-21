const express = require('express');
const { pool } = require('../../db'); // Adjust the path as necessary
const router = express.Router();

// Helper function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Function to fetch scheme of study
async function getSchemeOfStudy() {
  const queryText = `
    SELECT 
      programs.name AS program,
      sessions.start_year || ' - ' || sessions.end_year AS session,
      courses.name AS course,
      string_agg(DISTINCT clos.clo_name, ', ') AS clos,
      string_agg(DISTINCT plos.plo_name, ', ') AS plos,
      'Dummy Teacher' AS teacher
    FROM courses
    JOIN programs ON programs.id = courses.program_id
    JOIN sessions ON sessions.id = courses.session_id
    JOIN clos ON clos.course_id = courses.id
    JOIN clo_plo_mapping ON clo_plo_mapping.clo_id = clos.id
    JOIN plos ON plos.id = clo_plo_mapping.plo_id
    GROUP BY programs.name, sessions.start_year, sessions.end_year, courses.name
  `;
  return query(queryText, []);
}

// Express route handler
router.get('/', async (req, res) => {
  try {
    const result = await getSchemeOfStudy();
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching scheme of study:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

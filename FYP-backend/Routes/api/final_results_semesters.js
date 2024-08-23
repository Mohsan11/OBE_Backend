// resultsRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require("../../db");

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}
// Fetch results details for a specific student and semester
router.get('/resultsDetails/final/:studentId/semester/:semesterId', async (req, res) => {
  const { studentId, semesterId } = req.params;

  try {
    const resultsQuery = `
      SELECT * FROM public.final_semester_results
      WHERE student_id = $1 AND semester_id = $2;
    `;
    const { rows: results } = await query(resultsQuery, [studentId, semesterId]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching results details:', error);
    res.status(500).json({ error: 'Error fetching results details' });
  }
});

// Save the final semester results
router.post('/results/save', async (req, res) => {
  const { student_id, program_id, session_id, semester_id, results } = req.body;

  try {
    // Check if the `results` array contains valid `course_id`
    for (let result of results) {
      if (!result.course_id) {
        return res.status(400).json({ error: 'course_id is missing for one or more results' });
      }
    }

    // First, delete existing results for the student and semester
    await query(`
      DELETE FROM public.final_semester_results
      WHERE student_id = $1 AND semester_id = $2;
    `, [student_id, semester_id]);

    // Insert new results
    const insertPromises = results.map(result =>
      query(`
        INSERT INTO public.final_semester_results 
          (student_id, program_id, session_id, semester_id, course_id, total_marks, obtained_marks, grade, gpa, credit_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        student_id,
        program_id,
        session_id,
        semester_id,
        result.course_id, // Ensure `course_id` is not null
        result.total_marks,
        result.obtained_marks,
        result.grade,
        result.gpa,
        result.credit_hours
      ])
    );

    await Promise.all(insertPromises);
    res.status(200).json({ message: 'Results successfully saved!' });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: 'Error saving results' });
  }
});

// ------------------------------------------------------------GEt results-------------------------
// resultsRoutes.js
// Fetch results details for a specific student, program, and session
router.get('/:studentId/:programId/:sessionId', async (req, res) => {
  const { studentId, programId, sessionId } = req.params;

  try {
    const resultsQuery = `
      SELECT * FROM public.final_semester_results
      WHERE student_id = $1 AND program_id = $2 AND session_id = $3
      ORDER BY semester_id;
    `;
    const { rows: results } = await query(resultsQuery, [studentId, programId, sessionId]);

    // Group results by semester_id
    const groupedResults = results.reduce((acc, result) => {
      const { semester_id } = result;
      if (!acc[semester_id]) {
        acc[semester_id] = [];
      }
      acc[semester_id].push(result);
      return acc;
    }, {});

    // Compute GPA and promotion status
    const finalResults = {};
    for (const [semesterId, records] of Object.entries(groupedResults)) {
      let totalCredits = 0;
      let totalGP = 0;

      records.forEach(record => {
        totalCredits += record.credit_hours;
        totalGP += record.gpa * record.credit_hours;
      });

      finalResults[semesterId] = {
        results: records,
        totalCredits,
        cgpa: (totalGP / totalCredits).toFixed(2),
        status: (totalGP / totalCredits) >= 2.0 ? 'Promoted' : 'Not Promoted' // Assuming 2.0 is the threshold for promotion
      };
    }

    res.json(finalResults);
  } catch (error) {
    console.error('Error fetching results details:', error);
    res.status(500).json({ error: 'Error fetching results details' });
  }
});

module.exports = router;

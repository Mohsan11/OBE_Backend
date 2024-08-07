const express = require('express');
const { pool } = require('../../../db'); // Adjust the path according to your project structure
const router = express.Router();

// Function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query:', { text, duration, rows: res.rowCount });
  return res;
}

// Retrieve courses assigned to a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  const teacherId = req.params.teacherId;
  try {
    const queryText = `
      SELECT c.id, c.course_name 
      FROM teacher_course_assignment tca
      JOIN courses c ON tca.course_id = c.id
      WHERE tca.teacher_id = $1
    `;
    const result = await query(queryText, [teacherId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve students enrolled in a course
router.get('/studentenrollments/course/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const queryText = `
      SELECT s.id, s.student_name, s.roll_number 
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      WHERE se.course_id = $1
    `;
    const result = await query(queryText, [courseId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve assessments for a course
router.get('/assessments/course/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const queryText = `
      SELECT a.id, a.assessment_type, a.total_marks, a.normalized_total_marks 
      FROM assessments a
      WHERE a.course_id = $1
    `;
    const result = await query(queryText, [courseId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve marks for a student in a course
router.get('/marks/student/:studentId/course/:courseId', async (req, res) => {
  const { studentId, courseId } = req.params;
  try {
    const queryText = `
      SELECT m.id, m.total_marks, m.obtained_marks, q.question_text, a.assessment_type 
      FROM marks m
      JOIN questions q ON m.question_id = q.id
      JOIN assessments a ON m.assessment_id = a.id
      WHERE m.student_id = $1 AND a.course_id = $2
    `;
    const result = await query(queryText, [studentId, courseId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve questions for an assessment
router.get('/questions/assessment/:assessmentId', async (req, res) => {
  const assessmentId = req.params.assessmentId;
  try {
    const queryText = `
      SELECT q.id, q.question_text, q.marks 
      FROM questions q
      WHERE q.assessment_id = $1
    `;
    const result = await query(queryText, [assessmentId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve marks for an assessment
router.get('/assessments/marks/assessment/:assessmentId', async (req, res) => {
  const assessmentId = req.params.assessmentId;
  try {
    const queryText = `
      SELECT m.total_marks, m.obtained_marks 
      FROM marks m
      WHERE m.assessment_id = $1
    `;
    const result = await query(queryText, [assessmentId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve assessment details
router.get('/assessments/:assessmentId', async (req, res) => {
  const assessmentId = req.params.assessmentId;
  try {
    const queryText = `
      SELECT a.id, a.assessment_type, a.total_marks, a.normalized_total_marks 
      FROM assessments a
      WHERE a.id = $1
    `;
    const result = await query(queryText, [assessmentId]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update result for an assessment
router.post('/results', async (req, res) => {
  const { final_total_marks, final_obtained_marks, assessment_id } = req.body;
  try {
    const queryText = `
      INSERT INTO results (final_total_marks, final_obtained_marks, assessment_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (assessment_id) DO UPDATE
      SET final_total_marks = $1, final_obtained_marks = $2
      RETURNING *
    `;
    const values = [final_total_marks, final_obtained_marks, assessment_id];
    const result = await query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const { pool } = require('../../db');
const router = express.Router();

// Function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query:', { text, duration, rows: res.rowCount });
  return res;
}

// Create a new result record
const createResult = async (req, res) => {
  const { final_total_marks, final_obtained_marks, assessment_id, student_id, assessment_name, assessment_type } = req.body;

  if (!final_total_marks || !final_obtained_marks || !assessment_id || !student_id, !assessment_name, !assessment_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const insertQuery = `INSERT INTO public.result (final_total_marks, final_obtained_marks, assessment_id, student_id, assessment_name, assessment_type)
      VALUES ($1, $2, $3 , $4, $5, $6)`;
    await pool.query(insertQuery, [parseFloat(final_total_marks).toFixed(1), parseFloat(final_obtained_marks).toFixed(1), assessment_id, student_id, assessment_name, assessment_type ]);
    res.status(201).json({ message: 'Result created successfully' });
  } catch (error) {
    console.error('Error inserting result:', error);
    res.status(500).json({ error: 'Failed to create result' });
  }
};



// Retrieve all results
async function getAllResults() {
  const queryText = 'SELECT * FROM result';
  const result = await query(queryText);
  return result.rows;
}

// Retrieve result by marks ID
async function getResultByMarksId(marksId) {
  const queryText = 'SELECT * FROM result WHERE marks_id = $1';
  const result = await query(queryText, [marksId]);
  return result.rows;
}
async function getResultBystudentId(studentId) {
  const queryText = 'SELECT * FROM result WHERE studnt_id = $1';
  const result = await query(queryText, [studentId]);
  return result.rows;
}

// Update an existing result
async function updateResult(id, resultData) {
  const { final_total_marks, final_obtained_marks } = resultData;
  const queryText = `UPDATE result
    SET final_total_marks = $1, final_obtained_marks = $2
    WHERE id = $3
    RETURNING *`;
  const values = [final_total_marks, parseFloat(final_obtained_marks).toFixed(1), id];
  const result = await query(queryText, values);
  return result.rows[0];
}

// Delete a result record
async function deleteResult(id) {
  const queryText = 'DELETE FROM result WHERE id = $1 RETURNING *';
  const result = await query(queryText, [id]);
  return result.rows[0];
}

const getResultByCourseAndStudent = async (courseId, studentId) => {
  const queryText = `
    SELECT
      r.assessment_id,
      r.assessment_name,
      r.assessment_type,
      r.final_total_marks,
      r.final_obtained_marks
    FROM
      public.result r
    WHERE
      r.assessment_id IN (
        SELECT a.id
        FROM public.assessments a
        WHERE a.course_id = $1
      )
      AND r.student_id = $2
  `;
  return pool.query(queryText, [courseId, studentId]);
};


// API route to create a new result
router.post('/', async (req, res) => {
  try {
    await createResult(req, res);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to get all results
router.get('/', async (req, res) => {
  try {
    const results = await getAllResults();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving results:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to get result by marks ID
router.get('/marks/:marksId', async (req, res) => {
  try {
    const { marksId } = req.params;
    const results = await getResultByMarksId(marksId);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving result:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/course/:courseId/student/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;

  try {
    const result = await getResultByCourseAndStudent(courseId, studentId);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching result:', err);
    res.status(500).json({ error: err.message });
  }
});

// API route to update a result
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const resultData = req.body;
    const updatedResult = await updateResult(id, resultData);
    res.status(200).json(updatedResult);
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to delete a result
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedResult = await deleteResult(id);
    res.status(200).json(deletedResult);
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
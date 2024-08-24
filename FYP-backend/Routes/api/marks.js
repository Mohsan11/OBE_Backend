const express = require('express');
const { pool } = require('../../db'); // Adjust the path according to your project structure
const router = express.Router();

// Function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query:', { text, duration, rows: res.rowCount });
  return res;
}

// Create a new mark record
async function createMark(mark) {
  const { student_id, question_id, assessment_id, total_marks, obtained_marks } = mark;

  // Check if the mark already exists
  const checkQuery = 'SELECT * FROM marks WHERE student_id = $1 AND question_id = $2';
  const checkResult = await query(checkQuery, [student_id, question_id]);
  if (checkResult.rows.length > 0) {
    throw new Error('Mark already exists for this student and question');
  }

  const queryText = `
    INSERT INTO marks (student_id, question_id, assessment_id, total_marks, obtained_marks)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [student_id, question_id, assessment_id, parseFloat(total_marks).toFixed(1), parseFloat(obtained_marks).toFixed(1)];
  const result = await query(queryText, values);
  return result.rows[0];
}

// Retrieve all marks
async function getAllMarks() {
  const queryText = 'SELECT * FROM marks';
  const result = await query(queryText);
  return result.rows;
}

// Retrieve marks by student ID and/or question ID
async function getMarks(studentId, questionId) {
  const queryText = 'SELECT * FROM marks WHERE student_id = $1 AND question_id = $2';
  const result = await query(queryText, [studentId, questionId]);
  return result.rows;
}

// Update an existing mark
async function updateMark(id, mark) {
  const { total_marks, obtained_marks } = mark;
  const queryText = `
    UPDATE marks
    SET total_marks = $1, obtained_marks = $2
    WHERE id = $3
    RETURNING *
  `;
  const values = [total_marks, obtained_marks, id];
  const result = await query(queryText, values);
  return result.rows[0];
}


// Delete a mark record
async function deleteMark(id) {
  const queryText = 'DELETE FROM marks WHERE id = $1 RETURNING *';
  const result = await query(queryText, [id]);
  return result.rows[0];
}

// API route to create a new mark
router.post('/', async (req, res) => {
  try {
    const mark = req.body;
    if (!mark.student_id || !mark.question_id || !mark.assessment_id || !mark.total_marks || !mark.obtained_marks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newMark = await createMark(mark);
    res.status(201).json(newMark);
  } catch (error) {
    console.error('Error creating mark:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to get all marks
router.get('/', async (req, res) => {
  try {
    const marks = await getAllMarks();
    res.status(200).json(marks);
  } catch (error) {
    console.error('Error retrieving marks:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to get marks by student ID and/or question ID
router.get('/student/:studentId/question/:questionId', async (req, res) => {
  try {
    const { studentId, questionId } = req.params;
    const marks = await getMarks(studentId, questionId);
    res.status(200).json(marks);
  } catch (error) {
    console.error('Error retrieving marks:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to update a mark
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const mark = req.body;
    const updatedMark = await updateMark(id, mark);
    res.status(200).json(updatedMark);
  } catch (error) {
    console.error('Error updating mark:', error);
    res.status(500).json({ error: error.message });
  }
});

// API route to delete a mark
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedMark = await deleteMark(id);
    res.status(200).json(deletedMark);
  } catch (error) {
    console.error('Error deleting mark:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const result = await query(`
      SELECT
        m.student_id,
        a.id AS assessment_id,
        a.assessment_name,
        a.assessment_type,
        a.course_id,
        c.name AS course_name,   -- Updated to match the actual column name
        m.total_marks,
        m.obtained_marks,
        q.id AS question_id
      FROM public.marks m
      JOIN public.assessments a ON m.assessment_id = a.id
      JOIN public.questions q ON m.question_id = q.id
      JOIN public.courses c ON a.course_id = c.id  -- Join with courses table
      WHERE m.student_id = $1
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching marks for student:', error);
    res.status(500).send('Internal Server Error');
  }
});

  // Endpoint to get marks by question ID
  router.get('/question/:questionId', async (req, res) => {
    const { questionId } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT * FROM marks WHERE question_id = $1`,
        [questionId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).json({ error: 'Failed to fetch marks' });
    }
  });

  async function updateMarkByQuestionId(questionId, obtainedMarks) {
    const queryText = `
      UPDATE public.marks
      SET obtained_marks = $1
      WHERE question_id = $2
      RETURNING *
    `;
    const values = [obtainedMarks, questionId];
    const result = await query(queryText, values);
  
    if (result.rows.length === 0) {
      throw new Error('Mark not found for the given question_id');
    }
  
    return result.rows[0];
  }
  router.put('/update/:question_id', async (req, res) => {
    const { question_id } = req.params;
    const { obtained_marks } = req.body;
  
    // Validate obtained_marks
    if (typeof obtained_marks !== 'number' || isNaN(obtained_marks)) {
      return res.status(400).json({ error: 'Invalid obtained_marks value.' });
    }
  
    try {
      const updatedMark = await updateMarkByQuestionId(question_id, obtained_marks);
      res.status(200).json(updatedMark);
    } catch (error) {
      console.error('Error updating mark:', error.message);
      res.status(500).json({ error: 'Failed to update the mark.' });
    }
  });
  

module.exports = router;

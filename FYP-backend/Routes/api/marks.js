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

// CRUD functions for the marks table

// Create a new mark record
async function createMark(mark) {
  const { student_id, question_id, total_marks, obtained_marks } = mark;
  const queryText = `
    INSERT INTO marks (student_id, question_id, total_marks, obtained_marks)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [student_id, question_id, total_marks, obtained_marks];
  return query(queryText, values);
}

// Get all marks
async function getAllMarks() {
  const queryText = 'SELECT * FROM marks';
  return query(queryText);
}

// Get a mark by its ID
async function getMarkById(id) {
  const queryText = 'SELECT * FROM marks WHERE id = $1';
  return query(queryText, [id]);
}

// Update a mark record
async function updateMark(id, mark) {
  const { student_id, question_id, total_marks, obtained_marks } = mark;
  const queryText = `
    UPDATE marks
    SET student_id = $1, question_id = $2, total_marks = $3, obtained_marks = $4
    WHERE id = $5
    RETURNING *`;
  const values = [student_id, question_id, total_marks, obtained_marks, id];
  return query(queryText, values);
}

// Delete a mark record
async function deleteMark(id) {
  const queryText = 'DELETE FROM marks WHERE id = $1';
  return query(queryText, [id]);
}

// Express route handlers

// Create a new mark
router.post('/', async (req, res) => {
  try {
    const result = await createMark(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all marks
router.get('/', async (req, res) => {
  try {
    const result = await getAllMarks();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a mark by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await getMarkById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mark not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a mark record
router.put('/:id', async (req, res) => {
  try {
    const result = await updateMark(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mark not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a mark record
router.delete('/:id', async (req, res) => {
  try {
    await deleteMark(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

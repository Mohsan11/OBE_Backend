const express = require("express");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

// Query function to execute SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for questions table
async function createQuestion(question) {
  const text = `INSERT INTO questions (question_text, assessment_id, clo_id, marks)
                VALUES ($1, $2, $3, $4) RETURNING *`;
  const values = [question.question_text, question.assessment_id, question.clo_id || null, question.marks];
  const res = await query(text, values);
  return res.rows[0];
}

async function getQuestions() {
  const text = "SELECT * FROM questions";
  const res = await query(text);
  return res.rows;
}

async function getQuestionById(id) {
  const text = "SELECT * FROM questions WHERE id = $1";
  const values = [id];
  const res = await query(text, values);
  return res.rows[0];
}

async function updateQuestion(id, question) {
  const text = `UPDATE questions
                SET question_text = $1, assessment_id = $2, clo_id = $3, marks = $4
                WHERE id = $5 RETURNING *`;
  const values = [question.question_text, question.assessment_id, question.clo_id, question.marks, id];
  const res = await query(text, values);
  return res.rows[0];
}

async function deleteQuestion(id) {
  const text = "DELETE FROM questions WHERE id = $1 RETURNING *";
  const values = [id];
  const res = await query(text, values);
  return res.rows[0];
}

// Route handlers
router.post("/", async (req, res) => {
  try {
    const question = await createQuestion(req.body);
    res.status(201).json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Error creating question" });
  }
});

router.get("/questions", async (req, res) => {
  try {
    const questions = await getQuestions();
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Error fetching questions" });
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    const question = await getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: "Error fetching question" });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const question = await updateQuestion(req.params.id, req.body);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Error updating question" });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const question = await deleteQuestion(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Error deleting question" });
  }
});

  // Fetch questions by assessment ID
  router.get('/assessment/:assessmentId', async (req, res) => {
    const { assessmentId } = req.params;
    try {
      const result = await pool.query(
        `SELECT * FROM questions WHERE assessment_id = $1`,
        [assessmentId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  })

  
module.exports = router;

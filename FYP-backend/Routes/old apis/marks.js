const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for Marks table
async function createMarks(marks) {
  const { assesment_id, std_id, teacher_id, total_marks, obtained_marks } =
    marks;
  const queryText =
    'INSERT INTO public."Marks"("Assesment_ID", "Std_ID", "Teacher_ID", "Total Marks", "Obtained Marks") VALUES($1, $2, $3, $4, $5) RETURNING *';
  const values = [
    assesment_id,
    std_id,
    teacher_id,
    total_marks,
    obtained_marks,
  ];
  return query(queryText, values);
}

async function getMarks(marksID) {
  const queryText = 'SELECT * FROM public."Marks" WHERE "Marks_ID" = $1';
  return query(queryText, [marksID]);
}

async function updateMarks(marksID, updates) {
  const queryText =
    'UPDATE public."Marks" SET "Assesment_ID" = $1, "Std_ID" = $2, "Teacher_ID" = $3, "Total Marks" = $4, "Obtained Marks" = $5 WHERE "Marks_ID" = $6 RETURNING *';
  const values = [
    updates.assesment_id,
    updates.std_id,
    updates.teacher_id,
    updates.total_marks,
    updates.obtained_marks,
    marksID,
  ];
  return query(queryText, values);
}

async function deleteMarks(marksID) {
  const queryText = 'DELETE FROM public."Marks" WHERE "Marks_ID" = $1';
  return query(queryText, [marksID]);
}

// Routes
router.post("/", async (req, res) => {
  try {
    const newMarks = await createMarks(req.body);
    res.json(newMarks.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const marks = await getMarks(id);
    if (marks.rows.length === 0) {
      return res.status(404).json("Marks not found");
    }
    res.json(marks.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedMarks = await updateMarks(id, updates);
    if (updatedMarks.rows.length === 0) {
      return res.status(404).json("Marks not found");
    }
    res.json(updatedMarks.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMarks = await deleteMarks(id);
    if (deletedMarks.rowCount === 0) {
      return res.status(404).json("Marks not found");
    }
    res.json("Marks deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

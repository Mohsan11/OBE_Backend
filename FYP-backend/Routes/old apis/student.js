const { pool } = require("../../db");
const express = require("express");
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for Student table
async function createStudent(student) {
  const { std_name, prog_id } = student;
  const queryText =
    'INSERT INTO public."Student"("Std_Name", "Prog_ID") VALUES($1, $2) RETURNING *';
  const values = [std_name, prog_id];
  return query(queryText, values);
}

async function getStudent(stdID) {
  const queryText = 'SELECT * FROM public."Student" WHERE "Std_ID" = $1';
  return query(queryText, [stdID]);
}

async function updateStudent(stdID, updates) {
  const queryText =
    'UPDATE public."Student" SET "Std_Name" = $1, "Prog_ID" = $2 WHERE "Std_ID" = $3 RETURNING *';
  const values = [updates.std_name, updates.prog_id, stdID];
  return query(queryText, values);
}

async function deleteStudent(stdID) {
  const queryText = 'DELETE FROM public."Student" WHERE "Std_ID" = $1';
  return query(queryText, [stdID]);
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createStudent(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getStudent(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateStudent(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteStudent(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

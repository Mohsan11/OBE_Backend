// routes/program.js
const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

// CRUD functions for Program table
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for Program table
async function createProgram(program) {
  const { prog_name, prog_code, dept_id, semester } = program;
  const queryText =
    'INSERT INTO public."Program"("Prog_Name", "Prog_Code", "Dept_ID", "Semester") VALUES($1, $2, $3, $4) RETURNING *';
  const values = [prog_name, prog_code, dept_id, semester];
  return query(queryText, values);
}

async function getProgram(progID) {
  const queryText = 'SELECT * FROM public."Program" WHERE "Prog_ID" = $1';
  return query(queryText, [progID]);
}

async function updateProgram(progID, updates) {
  const { prog_name, prog_code, dept_id, semester } = updates;
  const queryText =
    'UPDATE public."Program" SET "Prog_Name" = $1, "Prog_Code" = $2, "Dept_ID" = $3, "Semester" = $4 WHERE "Prog_ID" = $5 RETURNING *';
  const values = [prog_name, prog_code, dept_id, semester, progID];
  return query(queryText, values);
}

async function deleteProgram(progID) {
  const queryText = 'DELETE FROM public."Program" WHERE "Prog_ID" = $1';
  return query(queryText, [progID]);
}

// Routes
router.get("/", async (req, res) => {
  try {
    const queryText = 'SELECT * FROM public."Program"';
    const result = await query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.post("/", async (req, res) => {
  try {
    const newProgram = await createProgram(req.body);
    res.json(newProgram.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const program = await getProgram(id);
    if (program.rows.length === 0) {
      return res.status(404).json("Program not found");
    }
    res.json(program.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedProgram = await updateProgram(id, updates);
    if (updatedProgram.rows.length === 0) {
      return res.status(404).json("Program not found");
    }
    res.json(updatedProgram.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProgram = await deleteProgram(id);
    if (deletedProgram.rowCount === 0) {
      return res.status(404).json("Program not found");
    }
    res.json("Program deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

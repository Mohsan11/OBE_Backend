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

// CRUD functions for Teacher table
async function createTeacher(teacher) {
  const { teacher_name, prog_id } = teacher;
  const queryText =
    'INSERT INTO public."Teacher"("Teacher_Name", "Prog_ID") VALUES($1, $2) RETURNING *';
  const values = [teacher_name, prog_id];
  return query(queryText, values);
}

async function getTeacher(teacherID) {
  const queryText = 'SELECT * FROM public."Teacher" WHERE "Teacher_ID" = $1';
  return query(queryText, [teacherID]);
}

async function updateTeacher(teacherID, updates) {
  const queryText =
    'UPDATE public."Teacher" SET "Teacher_Name" = $1, "Prog_ID" = $2 WHERE "Teacher_ID" = $3 RETURNING *';
  const values = [updates.teacher_name, updates.prog_id, teacherID];
  return query(queryText, values);
}

async function deleteTeacher(teacherID) {
  const queryText = 'DELETE FROM public."Teacher" WHERE "Teacher_ID" = $1';
  return query(queryText, [teacherID]);
}

// Routes
router.post("/", async (req, res) => {
  try {
    const newTeacher = await createTeacher(req.body);
    res.json(newTeacher.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await getTeacher(id);
    if (teacher.rows.length === 0) {
      return res.status(404).json("Teacher not found");
    }
    res.json(teacher.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedTeacher = await updateTeacher(id, updates);
    if (updatedTeacher.rows.length === 0) {
      return res.status(404).json("Teacher not found");
    }
    res.json(updatedTeacher.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTeacher = await deleteTeacher(id);
    if (deletedTeacher.rowCount === 0) {
      return res.status(404).json("Teacher not found");
    }
    res.json("Teacher deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

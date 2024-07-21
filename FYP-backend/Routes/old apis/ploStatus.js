const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

// Helper function for executing SQL queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Helper function to check if a record exists in a table
async function recordExists(table, column, value) {
  const queryText = `SELECT 1 FROM public."${table}" WHERE "${column}" = $1 LIMIT 1`;
  const res = await query(queryText, [value]);
  return res.rowCount > 0;
}

// CREATE - Insert new student PLO status
async function createStudentPLOStatus(status) {
  const { std_id, std_name, plo_id, plo_description, plo_status, prog_id } =
    status;

  // Check if Student and PLO records exist
  const studentExists = await recordExists("Student", "Std_ID", std_id);
  const ploExists = await recordExists("PLO", "PLO_ID", plo_id);

  if (!studentExists) {
    throw new Error(`Student with Std_ID ${std_id} does not exist`);
  }
  if (!ploExists) {
    throw new Error(`PLO with PLO_ID ${plo_id} does not exist`);
  }

  const queryText =
    'INSERT INTO public."StudentPLOStatus"("Std_ID", "Std_Name", "PLO_ID", "PLO_Description", "PLO_Status", "Prog_ID") VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
  const values = [
    std_id,
    std_name,
    plo_id,
    plo_description,
    plo_status,
    prog_id,
  ];
  return query(queryText, values);
}

// READ - Get student PLO status by student ID and PLO ID
async function getStudentPLOStatus(stdID, ploID) {
  const queryText =
    'SELECT * FROM public."StudentPLOStatus" WHERE "Std_ID" = $1 AND "PLO_ID" = $2';
  return query(queryText, [stdID, ploID]);
}

// UPDATE - Update student PLO status by student ID and PLO ID
async function updateStudentPLOStatus(stdID, ploID, updates) {
  const queryText =
    'UPDATE public."StudentPLOStatus" SET "PLO_Status" = $1 WHERE "Std_ID" = $2 AND "PLO_ID" = $3 RETURNING *';
  const values = [updates.plo_status, stdID, ploID];
  return query(queryText, values);
}

// DELETE - Delete student PLO status by student ID and PLO ID
async function deleteStudentPLOStatus(stdID, ploID) {
  const queryText =
    'DELETE FROM public."StudentPLOStatus" WHERE "Std_ID" = $1 AND "PLO_ID" = $2';
  return query(queryText, [stdID, ploID]);
}

// Routes
router.post("/", async (req, res) => {
  try {
    const newStatus = await createStudentPLOStatus(req.body);
    res.json(newStatus.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get("/:stdID/:ploID", async (req, res) => {
  try {
    const { stdID, ploID } = req.params;
    const status = await getStudentPLOStatus(stdID, ploID);
    if (status.rows.length === 0) {
      return res.status(404).json("Student PLO status not found");
    }
    res.json(status.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:stdID/:ploID", async (req, res) => {
  try {
    const { stdID, ploID } = req.params;
    const updates = req.body;
    const updatedStatus = await updateStudentPLOStatus(stdID, ploID, updates);
    if (updatedStatus.rows.length === 0) {
      return res.status(404).json("Student PLO status not found");
    }
    res.json(updatedStatus.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:stdID/:ploID", async (req, res) => {
  try {
    const { stdID, ploID } = req.params;
    await deleteStudentPLOStatus(stdID, ploID);
    res.json("Student PLO status deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

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

// CRUD functions for StudentCLOStatus table
async function createStudentCLOStatus(status) {
  const { std_id, std_name, clo_id, clo_description, clo_status } = status;
  const queryText =
    'INSERT INTO public."StudentCLOStatus"("Std_ID", "Std_Name", "CLO_ID", "CLO_Description", "Clo_Status") VALUES($1, $2, $3, $4, $5) RETURNING *';
  const values = [std_id, std_name, clo_id, clo_description, clo_status];
  return query(queryText, values);
}

async function getStudentCLOStatus(stdID, cloID) {
  const queryText =
    'SELECT * FROM public."StudentCLOStatus" WHERE "Std_ID" = $1 AND "CLO_ID" = $2';
  return query(queryText, [stdID, cloID]);
}

async function updateStudentCLOStatus(stdID, cloID, updates) {
  const { clo_status } = updates;
  const queryText =
    'UPDATE public."StudentCLOStatus" SET "Clo_Status" = $1 WHERE "Std_ID" = $2 AND "CLO_ID" = $3 RETURNING *';
  const values = [clo_status, stdID, cloID];
  return query(queryText, values);
}

async function deleteStudentCLOStatus(stdID, cloID) {
  const queryText =
    'DELETE FROM public."StudentCLOStatus" WHERE "Std_ID" = $1 AND "CLO_ID" = $2';
  return query(queryText, [stdID, cloID]);
}

// Routes
router.post("/", async (req, res) => {
  try {
    const newStatus = await createStudentCLOStatus(req.body);
    res.json(newStatus.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.get("/:std_id/:clo_id", async (req, res) => {
  try {
    const { std_id, clo_id } = req.params;
    const status = await getStudentCLOStatus(std_id, clo_id);
    if (status.rows.length === 0) {
      return res.status(404).json("Status not found");
    }
    res.json(status.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:std_id/:clo_id", async (req, res) => {
  try {
    const { std_id, clo_id } = req.params;
    const updates = req.body;
    const updatedStatus = await updateStudentCLOStatus(std_id, clo_id, updates);
    if (updatedStatus.rows.length === 0) {
      return res.status(404).json("Status not found");
    }
    res.json(updatedStatus.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:std_id/:clo_id", async (req, res) => {
  try {
    const { std_id, clo_id } = req.params;
    const deletedStatus = await deleteStudentCLOStatus(std_id, clo_id);
    if (deletedStatus.rowCount === 0) {
      return res.status(404).json("Status not found");
    }
    res.json("Status deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

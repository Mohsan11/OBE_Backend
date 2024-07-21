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

// CRUD functions for Assesment table
async function createAssesment(assesment) {
  const { assesment_type, assesment_q_no, clo_id } = assesment;
  const queryText =
    'INSERT INTO public."Assesment"("Assesment_Type", "Assesment_Q_No", "CLO_ID") VALUES($1, $2, $3) RETURNING *';
  const values = [assesment_type, assesment_q_no, clo_id];
  return query(queryText, values);
}

async function getAssesment(assesmentID) {
  const queryText =
    'SELECT * FROM public."Assesment" WHERE "Assesment_ID" = $1';
  return query(queryText, [assesmentID]);
}

async function updateAssesment(assesmentID, updates) {
  const queryText =
    'UPDATE public."Assesment" SET "Assesment_Type" = $1, "Assesment_Q_No" = $2, "CLO_ID" = $3 WHERE "Assesment_ID" = $4 RETURNING *';
  const values = [
    updates.assesment_type,
    updates.assesment_q_no,
    updates.clo_id,
    assesmentID,
  ];
  return query(queryText, values);
}

async function deleteAssesment(assesmentID) {
  const queryText = 'DELETE FROM public."Assesment" WHERE "Assesment_ID" = $1';
  return query(queryText, [assesmentID]);
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createAssesment(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getAssesment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assesment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateAssesment(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assesment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteAssesment(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

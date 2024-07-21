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

// CRUD functions for CLO table
async function createCLO(clo) {
  const { clo_description, plo_id } = clo;
  const queryText =
    'INSERT INTO public."CLO"("CLO_Description", "PLO_ID") VALUES($1, $2) RETURNING *';
  const values = [clo_description, plo_id];
  return query(queryText, values);
}

async function getCLO(cloID) {
  const queryText = 'SELECT * FROM public."CLO" WHERE "CLO_ID" = $1';
  return query(queryText, [cloID]);
}

async function updateCLO(cloID, updates) {
  const queryText =
    'UPDATE public."CLO" SET "CLO_Description" = $1, "PLO_ID" = $2 WHERE "CLO_ID" = $3 RETURNING *';
  const values = [updates.clo_description, updates.plo_id, cloID];
  return query(queryText, values);
}

async function deleteCLO(cloID) {
  const queryText = 'DELETE FROM public."CLO" WHERE "CLO_ID" = $1';
  return query(queryText, [cloID]);
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createCLO(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getCLO(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateCLO(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteCLO(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

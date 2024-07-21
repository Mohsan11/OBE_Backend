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

// CRUD functions for PLO table
async function createPLO(plo) {
  const { plo_description, prog_id } = plo;
  const queryText =
    'INSERT INTO public."PLO"("PLO_Description", "Prog_ID") VALUES($1, $2) RETURNING *';
  const values = [plo_description, prog_id];
  return query(queryText, values);
}

async function getPLO(ploID) {
  const queryText = 'SELECT * FROM public."PLO" WHERE "PLO_ID" = $1';
  return query(queryText, [ploID]);
}

async function updatePLO(ploID, updates) {
  const queryText =
    'UPDATE public."PLO" SET "PLO_Description" = $1, "Prog_ID" = $2 WHERE "PLO_ID" = $3 RETURNING *';
  const values = [updates.plo_description, updates.prog_id, ploID];
  return query(queryText, values);
}

async function deletePLO(ploID) {
  const queryText = 'DELETE FROM public."PLO" WHERE "PLO_ID" = $1';
  return query(queryText, [ploID]);
}

// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createPLO(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getPLO(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updatePLO(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PLO not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deletePLO(req.params.id);
    res.status(204).send("Plo deleted sucessfully.").end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

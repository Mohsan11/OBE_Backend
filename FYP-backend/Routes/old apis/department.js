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

// CRUD functions for Department table
async function createDepartment(department) {
  const { dept_name, dept_code } = department;
  const queryText =
    'INSERT INTO public."Department"("Dept_Name", "Dept_Code") VALUES($1, $2) RETURNING *';
  const values = [dept_name, dept_code];
  return query(queryText, values);
}

async function getDepartment(depID) {
  const queryText = 'SELECT * FROM public."Department" WHERE "Dept_ID" = $1';
  return query(queryText, [depID]);
}

async function updateDepartment(depID, updates) {
  const { dept_name, dept_code } = updates;
  const queryText =
    'UPDATE public."Department" SET "Dept_Name" = $1, "Dept_Code" = $2,  WHERE "Dept_ID" = $4 RETURNING *';
  const values = [dept_name, dept_code, depID];
  return query(queryText, values);
}

async function deleteDepartment(depID) {
  const queryText = 'DELETE FROM public."Department" WHERE "Dept_ID" = $1';
  return query(queryText, [depID]);
}

// Route to fetch all departments
router.get("/", async (req, res) => {
  try {
    const queryText = 'SELECT * FROM public."Department"';
    const result = await query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const department = await getDepartment(id);
    if (department.rows.length === 0) {
      return res.status(404).json("Department not found");
    }
    res.json(department.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

// Routes
router.post("/", async (req, res) => {
  try {
    const newDepartment = await createDepartment(req.body);
    res.json(newDepartment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const department = await getDepartment(id);
    if (department.rows.length === 0) {
      return res.status(404).json("Department not found");
    }
    res.json(department.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedDepartment = await updateDepartment(id, updates);
    if (updatedDepartment.rows.length === 0) {
      return res.status(404).json("Department not found");
    }
    res.json(updatedDepartment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDepartment = await deleteDepartment(id);
    if (deletedDepartment.rowCount === 0) {
      return res.status(404).json("Department not found");
    }
    res.json("Department deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;

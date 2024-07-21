const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for users table
async function createUser(user) {
  const { username, password, role, email } = user;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [username, hashedPassword, role, email];
  return query(queryText, values);
}

async function getUser(userId) {
  const queryText = 'SELECT * FROM users WHERE id = $1';
  return query(queryText, [userId]);
}

async function getAllUsers() {
  const queryText = 'SELECT * FROM users';
  return query(queryText, []);
}

async function updateUser(userId, updates) {
  const { username, password, role, email } = updates;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'UPDATE users SET username = $1, password = $2, role = $3, email = $4 WHERE id = $5 RETURNING *';
  const values = [username, hashedPassword, role, email, userId];
  return query(queryText, values);
}

async function deleteUser(userId) {
  const queryText = 'DELETE FROM users WHERE id = $1';
  return query(queryText, [userId]);
}

async function getUserByEmail(email) {
  const queryText = 'SELECT * FROM users WHERE email = $1';
  return query(queryText, [email]);
}

async function getTotalUsersByRole(role) {
  const queryText = 'SELECT COUNT(*) FROM users WHERE role = $1';
  const result = await query(queryText, [role]);
  return result.rows[0].count;
}
// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/all", async (req, res) => {
  try {
    const result = await getAllUsers();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/role/:role", async (req, res) => {
  const { role } = req.params;
  try {
    const result = await query('SELECT * FROM users WHERE role = $1', [role]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getUser(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateUser(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await getUserByEmail(email);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, username: user.username, role: user.role,email:user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/totalUsers/:role", async (req, res) => {
  const { role } = req.params;
  try {
    const count = await getTotalUsersByRole(role);
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

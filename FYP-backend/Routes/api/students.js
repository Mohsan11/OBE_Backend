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

// CRUD functions for students table
async function createStudent(student) {
  const { roll_number, student_name, password, email, program_id, session_id } = student;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'INSERT INTO students (roll_number, student_name, password, email, program_id, session_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  const values = [roll_number, student_name, hashedPassword, email, program_id, session_id];
  return query(queryText, values);
}

async function getStudent(studentId) {
  const queryText = 'SELECT * FROM students WHERE id = $1';
  return query(queryText, [studentId]);
}

async function updateStudent(studentId, updates) {
  const { roll_number, student_name, password, email, program_id, session_id } = updates;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'UPDATE students SET roll_number = $1, student_name = $2, password = $3, email = $4, program_id = $5, session_id = $6 WHERE id = $7 RETURNING *';
  const values = [roll_number, student_name, hashedPassword, email, program_id, session_id, studentId];
  return query(queryText, values);
}

async function deleteStudent(studentId) {
  const queryText = 'DELETE FROM students WHERE id = $1';
  return query(queryText, [studentId]);
}

async function getAllStudents() {
  const queryText = 'SELECT * FROM students';
  return query(queryText, []);
}

async function getStudentByRollNumber(roll_number) {
  const queryText = 'SELECT * FROM students WHERE roll_number = $1';
  return query(queryText, [roll_number]);
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

router.get("/all", async (req, res) => {
  try {
    const result = await getAllStudents();
    res.status(200).json(result.rows);
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

// Register route
router.post("/register", async (req, res) => {
  try {
    const result = await createStudent(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { roll_number, password } = req.body;
    const studentResult = await getStudentByRollNumber(roll_number);

    if (studentResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const student = studentResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, student.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      student: { id: student.id, roll_number: student.roll_number, student_name: student.student_name, email: student.email, program_id: student.program_id, session_id: student.session_id },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Fetch students based on program_id and session_id
router.get('/:programId/:sessionId', async (req, res) => {
  const { programId, sessionId } = req.params;

  try {
    const students = await query(
      'SELECT * FROM students WHERE program_id = $1 AND session_id = $2',
      [programId, sessionId]
    );
    res.json(students.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

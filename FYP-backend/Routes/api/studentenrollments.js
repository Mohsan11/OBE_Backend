const express = require("express");
const { pool } = require("../../db");
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for student enrollments table
async function createEnrollment(enrollment) {
  const { student_id, course_id, semester_id } = enrollment;
  const queryText = 'INSERT INTO studentenrollments (student_id, course_id, semester_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [student_id, course_id, semester_id];
  return query(queryText, values);
}

async function getEnrollment(enrollmentId) {
  const queryText = 'SELECT * FROM studentenrollments WHERE id = $1';
  return query(queryText, [enrollmentId]);
}

async function deleteEnrollment(enrollmentId) {
  const queryText = 'DELETE FROM studentenrollments WHERE id = $1';
  return query(queryText, [enrollmentId]);
}

async function getEnrollmentsByStudent(student_id) {
  const queryText = 'SELECT * FROM studentenrollments WHERE student_id = $1';
  return query(queryText, [student_id]);
}

async function getEnrollmentsByCourse(course_id) {
  const queryText = `
    SELECT se.id, se.student_id, s.student_name, s.roll_number, c.name AS course_name
    FROM studentenrollments se
    JOIN students s ON se.student_id = s.id
    JOIN courses c ON se.course_id = c.id
    WHERE se.course_id = $1
  `;
  return query(queryText, [course_id]);
}

async function getAllEnrollments() {
  const queryText = `
    SELECT se.id, s.student_name, s.roll_number, c.name AS course_name, sem.name AS semester_name
    FROM studentenrollments se
    JOIN students s ON se.student_id = s.student_id
    JOIN courses c ON se.course_id = c.id
    JOIN semesters sem ON se.semester_id = sem.id;
  `;
  return query(queryText, []);
}

async function updateEnrollment(enrollmentId, updates) {
  const { student_id, course_id, semester_id } = updates;
  const queryText = `
    UPDATE studentenrollments 
    SET student_id = $1, course_id = $2, semester_id = $3
    WHERE id = $4
    RETURNING *;
  `;
  const values = [student_id, course_id, semester_id, enrollmentId];
  return query(queryText, values);
}


// Express route handlers
router.post("/", async (req, res) => {
  try {
    const result = await createEnrollment(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getEnrollment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteEnrollment(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const result = await getAllEnrollments();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateEnrollment(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/student/:student_id", async (req, res) => {
  try {
    const result = await getEnrollmentsByStudent(req.params.student_id);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/course/:course_id", async (req, res) => {
  try {
    const result = await getEnrollmentsByCourse(req.params.course_id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No students found for this course" });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/courses/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  const query = `
    SELECT s.id, s.student_name, s.roll_number, c.course_name
    FROM students s
    JOIN studentenrollments se ON s.id = se.student_id
    JOIN courses c ON se.course_id = c.id
    WHERE se.course_id = $1;
  `;
  pool.query(query, [courseId], (error, results) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.json(results.rows);
    }
  });
});

router.get("/student/:student_id/course/:course_id", async (req, res) => {
  try {
    const { student_id, course_id } = req.params;
    const result = await query(
      "SELECT * FROM studentenrollments WHERE student_id = $1 AND course_id = $2",
      [student_id, course_id]
    );
    res.status(200).json(result.rows); // Respond with the rows, even if empty
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('student/:id', async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const query = `
      SELECT e.course_id, c.course_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      WHERE e.student_id = $1
    `;
    const values = [studentId];

    const result = await query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No enrollments found for this student.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/students', async (req, res) => {
  const { course_id, semester_id } = req.query;

  try {
      const query = `
          SELECT s.id, s.student_name
          FROM students s
          INNER JOIN studentenrollments se ON s.id = se.student_id
          WHERE se.course_id = $1 AND se.semester_id = $2
      `;
      const result = await pool.query(query, [course_id, semester_id]);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

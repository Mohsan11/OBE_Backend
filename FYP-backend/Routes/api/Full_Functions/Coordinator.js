const express = require("express");
const { pool } = require("../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// User Management
async function createUser(user) {
  const { role, name, email, password, program_id, session_id, roll_number } = user;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'INSERT INTO users (role, name, email, password, program_id, session_id, roll_number) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  const values = [role, name, email, hashedPassword, program_id, session_id, roll_number];
  return query(queryText, values);
}

async function getUser(userId) {
  const queryText = 'SELECT * FROM users WHERE id = $1';
  return query(queryText, [userId]);
}

async function updateUser(userId, updates) {
  const { role, name, email, password, program_id, session_id, roll_number } = updates;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText =
    'UPDATE users SET role = $1, name = $2, email = $3, password = $4, program_id = $5, session_id = $6, roll_number = $7 WHERE id = $8 RETURNING *';
  const values = [role, name, email, hashedPassword, program_id, session_id, roll_number, userId];
  return query(queryText, values);
}

async function deleteUser(userId) {
  const queryText = 'DELETE FROM users WHERE id = $1';
  return query(queryText, [userId]);
}

async function getAllUsers() {
  const queryText = 'SELECT * FROM users';
  return query(queryText, []);
}

// Program Management
async function createProgram(program) {
  const { name, code } = program;
  const queryText =
    'INSERT INTO programs (name, code) VALUES ($1, $2) RETURNING *';
  const values = [name, code];
  return query(queryText, values);
}

async function getProgram(programId) {
  const queryText = 'SELECT * FROM programs WHERE id = $1';
  return query(queryText, [programId]);
}

async function updateProgram(programId, updates) {
  const { name, code } = updates;
  const queryText =
    'UPDATE programs SET name = $1, code = $2 WHERE id = $3 RETURNING *';
  const values = [name, code, programId];
  return query(queryText, values);
}

async function deleteProgram(programId) {
  const queryText = 'DELETE FROM programs WHERE id = $1';
  return query(queryText, [programId]);
}

async function getAllPrograms() {
  const queryText = 'SELECT * FROM programs';
  return query(queryText, []);
}

// Course Management
async function createCourse(course) {
  const { name, code, program_id } = course;
  const queryText =
    'INSERT INTO courses (name, code, program_id) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, code, program_id];
  return query(queryText, values);
}

async function getCourse(courseId) {
  const queryText = 'SELECT * FROM courses WHERE id = $1';
  return query(queryText, [courseId]);
}

async function updateCourse(courseId, updates) {
  const { name, code, program_id } = updates;
  const queryText =
    'UPDATE courses SET name = $1, code = $2, program_id = $3 WHERE id = $4 RETURNING *';
  const values = [name, code, program_id, courseId];
  return query(queryText, values);
}

async function deleteCourse(courseId) {
  const queryText = 'DELETE FROM courses WHERE id = $1';
  return query(queryText, [courseId]);
}

async function getAllCourses() {
  const queryText = 'SELECT * FROM courses';
  return query(queryText, []);
}

// CLO Management
async function createCLO(clo) {
  const { description, course_id } = clo;
  const queryText =
    'INSERT INTO clos (description, course_id) VALUES ($1, $2) RETURNING *';
  const values = [description, course_id];
  return query(queryText, values);
}

async function getCLO(cloId) {
  const queryText = 'SELECT * FROM clos WHERE id = $1';
  return query(queryText, [cloId]);
}

async function updateCLO(cloId, updates) {
  const { description, course_id } = updates;
  const queryText =
    'UPDATE clos SET description = $1, course_id = $2 WHERE id = $3 RETURNING *';
  const values = [description, course_id, cloId];
  return query(queryText, values);
}

async function deleteCLO(cloId) {
  const queryText = 'DELETE FROM clos WHERE id = $1';
  return query(queryText, [cloId]);
}

async function getAllCLOs() {
  const queryText = 'SELECT * FROM clos';
  return query(queryText, []);
}

// PLO Management
async function createPLO(plo) {
  const { description, program_id } = plo;
  const queryText =
    'INSERT INTO plos (description, program_id) VALUES ($1, $2) RETURNING *';
  const values = [description, program_id];
  return query(queryText, values);
}

async function getPLO(ploId) {
  const queryText = 'SELECT * FROM plos WHERE id = $1';
  return query(queryText, [ploId]);
}

async function updatePLO(ploId, updates) {
  const { description, program_id } = updates;
  const queryText =
    'UPDATE plos SET description = $1, program_id = $2 WHERE id = $3 RETURNING *';
  const values = [description, program_id, ploId];
  return query(queryText, values);
}

async function deletePLO(ploId) {
  const queryText = 'DELETE FROM plos WHERE id = $1';
  return query(queryText, [ploId]);
}

async function getAllPLOs() {
  const queryText = 'SELECT * FROM plos';
  return query(queryText, []);
}

// Session/Semester Management
async function createSession(session) {
  const { name, start_date, end_date } = session;
  const queryText =
    'INSERT INTO sessions (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *';
  const values = [name, start_date, end_date];
  return query(queryText, values);
}

async function getSession(sessionId) {
  const queryText = 'SELECT * FROM sessions WHERE id = $1';
  return query(queryText, [sessionId]);
}

async function updateSession(sessionId, updates) {
  const { name, start_date, end_date } = updates;
  const queryText =
    'UPDATE sessions SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *';
  const values = [name, start_date, end_date, sessionId];
  return query(queryText, values);
}

async function deleteSession(sessionId) {
  const queryText = 'DELETE FROM sessions WHERE id = $1';
  return query(queryText, [sessionId]);
}

async function getAllSessions() {
  const queryText = 'SELECT * FROM sessions';
  return query(queryText, []);
}

// Express route handlers for Coordinator functionalities

// User Management
router.post("/users", async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/all", async (req, res) => {
  try {
    const result = await getAllUsers();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:id", async (req, res) => {
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

router.put("/users/:id", async (req, res) => {
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

router.delete("/users/:id", async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Program Management
router.post("/programs", async (req, res) => {
  try {
    const result = await createProgram(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/programs/all", async (req, res) => {
  try {
    const result = await getAllPrograms();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/programs/:id", async (req, res) => {
    try {
      const result = await getProgram(req.params.id);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

router.put("/programs/:id", async (req, res) => {
  try {
    const result = await updateProgram(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Program not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/programs/:id", async (req, res) => {
  try {
    await deleteProgram(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course Management
router.post("/courses", async (req, res) => {
  try {
    const result = await createCourse(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/courses/all", async (req, res) => {
  try {
    const result = await getAllCourses();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const result = await getCourse(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/courses/:id", async (req, res) => {
  try {
    const result = await updateCourse(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/courses/:id", async (req, res) => {
  try {
    await deleteCourse(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLO Management
async function createCLO(clo) {
    const { clo_name, description, course_id } = clo;
    const queryText =
      'INSERT INTO clos (clo_name, description, course_id) VALUES ($1, $2, $3) RETURNING *';
    const values = [clo_name, description, course_id];
    return query(queryText, values);
  }
  
  async function getCLO(cloId) {
    const queryText = 'SELECT * FROM clos WHERE id = $1';
    return query(queryText, [cloId]);
  }
  
  async function updateCLO(cloId, updates) {
    const { clo_name, description, course_id } = updates;
    const queryText =
      'UPDATE clos SET clo_name = $1, description = $2, course_id = $3 WHERE id = $4 RETURNING *';
    const values = [clo_name, description, course_id, cloId];
    return query(queryText, values);
  }
  
  async function deleteCLO(cloId) {
    const queryText = 'DELETE FROM clos WHERE id = $1';
    return query(queryText, [cloId]);
  }
  
  async function getAllCLOs() {
    const queryText = 'SELECT * FROM clos';
    return query(queryText, []);
  }
  
  // PLO Management
  async function createPLO(plo) {
    const { plo_name, description, program_id } = plo;
    const queryText =
      'INSERT INTO plos (plo_name, description, program_id) VALUES ($1, $2, $3) RETURNING *';
    const values = [plo_name, description, program_id];
    return query(queryText, values);
  }
  
  async function getPLO(ploId) {
    const queryText = 'SELECT * FROM plos WHERE id = $1';
    return query(queryText, [ploId]);
  }
  
  async function updatePLO(ploId, updates) {
    const { plo_name, description, program_id } = updates;
    const queryText =
      'UPDATE plos SET plo_name = $1, description = $2, program_id = $3 WHERE id = $4 RETURNING *';
    const values = [plo_name, description, program_id, ploId];
    return query(queryText, values);
  }
  
  async function deletePLO(ploId) {
    const queryText = 'DELETE FROM plos WHERE id = $1';
    return query(queryText, [ploId]);
  }
  
  async function getAllPLOs() {
    const queryText = 'SELECT * FROM plos';
    return query(queryText, []);
  }
  
  // Express route handlers for CLO and PLO management
  
  // CLO Management
  router.post("/clos", async (req, res) => {
    try {
      const result = await createCLO(req.body);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/clos/all", async (req, res) => {
    try {
      const result = await getAllCLOs();
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/clos/:id", async (req, res) => {
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
  
  router.put("/clos/:id", async (req, res) => {
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
  
  router.delete("/clos/:id", async (req, res) => {
    try {
      await deleteCLO(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // PLO Management
  router.post("/plos", async (req, res) => {
    try {
      const result = await createPLO(req.body);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/plos/all", async (req, res) => {
    try {
      const result = await getAllPLOs();
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get("/plos/:id", async (req, res) => {
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
  
  router.put("/plos/:id", async (req, res) => {
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
  
  router.delete("/plos/:id", async (req, res) => {
    try {
      await deletePLO(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// Session/Semester Management
router.post("/sessions", async (req, res) => {
  try {
    const result = await createSession(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sessions/all", async (req, res) => {
  try {
    const result = await getAllSessions();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const result = await getSession(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/sessions/:id", async (req, res) => {
  try {
    const result = await updateSession(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    await deleteSession(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

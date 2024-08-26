const express = require("express");
const { pool } = require("../../../../db");
const router = express.Router();

// Helper function to execute queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Function to get courses for a student in a specific semester
async function getCoursesByStudentAndSemester(studentId, semesterId) {
  const queryText = `
    SELECT c.id AS course_id, c.name
    FROM studentenrollments se
    JOIN courses c ON se.course_id = c.id
    WHERE se.student_id = $1 AND c.semester_id = $2
  `;
  const values = [studentId, semesterId];
  return query(queryText, values);
}

router.get("/clo-achievements/:studentId/:semesterId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      const semesterId = parseInt(req.params.semesterId, 10);
      
      // Validate IDs
      if (isNaN(studentId) || isNaN(semesterId) || studentId <= 0 || semesterId <= 0) {
        return res.status(400).json({ message: 'Invalid studentId or semesterId' });
      }
  
      // Fetch courses for the student in the specified semester
      const coursesResult = await getCoursesByStudentAndSemester(studentId, semesterId);
      const courses = coursesResult.rows;
  
      // Prepare to store the results
      const results = [];
  
      // Process each course
      for (const course of courses) {
        const courseId = course.course_id;
        const courseName = course.name;
  
        // Get CLOs for the course
        const closResult = await query('SELECT * FROM clos WHERE course_id = $1', [courseId]);
        const clos = closResult.rows;
  
        if (clos.length === 0) {
          results.push({
            course_id: courseId,
            course_name: courseName,
            message: 'No CLOs mapped to this course.'
          });
          continue;
        }
  
        // Process CLOs
        for (const clo of clos) {
          const cloId = clo.id;
  
          // Get questions and marks for the CLO
          const questionsResult = await query(`
            SELECT COALESCE(SUM(q.marks), 0) AS total_marks, COALESCE(SUM(m.obtained_marks), 0) AS obtained_marks
            FROM questions q
            JOIN assessments a ON q.assessment_id = a.id
            LEFT JOIN marks m ON q.id = m.question_id AND m.student_id = $1
            WHERE q.clo_id = $2
          `, [studentId, cloId]);
  
          const { total_marks: totalMarks, obtained_marks: obtainedMarks } = questionsResult.rows[0];
  
          // Determine if the CLO is achieved (50% threshold)
          const passed = (totalMarks > 0) && ((obtainedMarks / totalMarks) >= 0.5);
  
          // Add result for this CLO
          results.push({
            course_id: courseId,
            course_name: courseName,
            clo_name: clo.clo_name,
            status: passed ? 'Passed' : 'Failed'
          });
        }
      }
  
      res.status(200).json(results);
    } catch (error) {
      console.error('Error fetching CLO achievements:', error);
      res.status(500).json({ message: 'Error fetching CLO achievements' });
    }
  });
  
  
// Function to get PLOs by CLO IDs
async function getPLOsByCLOs(cloIds) {
    const queryText = `
      SELECT DISTINCT p.id AS plo_id, p.description AS plo_name
      FROM plos p
      JOIN clo_plo_mapping cpm ON p.id = cpm.plo_id
      WHERE cpm.clo_id = ANY($1)
    `;
    const values = [cloIds];
    return query(queryText, values);
  }
  
  
  // Function to get CLOs by course IDs
  async function getCLOsByCourses(courseIds) {
    const queryText = `
      SELECT c.id AS clo_id, c.course_id, c.description, c.clo_name
      FROM clos c
      WHERE c.course_id = ANY($1)
    `;
    const values = [courseIds];
    return query(queryText, values);
  }
  
  // Function to get CLO-PLO Mapping
  async function getCLOPLOMapping(cloIds) {
    const queryText = `
      SELECT clo_id, plo_id
      FROM clo_plo_mapping
      WHERE clo_id = ANY($1)
    `;
    const values = [cloIds];
    return query(queryText, values);
  }
  
  // Function to get courses for a student in a specific semester
  async function getCoursesByStudentAndSemester(studentId, semesterId) {
    const queryText = `
      SELECT c.id AS course_id, c.name
      FROM studentenrollments se
      JOIN courses c ON se.course_id = c.id
      WHERE se.student_id = $1 AND c.semester_id = $2
    `;
    const values = [studentId, semesterId];
    return query(queryText, values);
  }
  
  router.get("/plo-achievements/:studentId/:semesterId", async (req, res) => {
      try {
        const studentId = parseInt(req.params.studentId, 10); // Ensure studentId is an integer
        const semesterId = parseInt(req.params.semesterId, 10); // Ensure semesterId is an integer
  
        // Validate that the IDs are integers and greater than zero
        if (isNaN(studentId) || isNaN(semesterId) || studentId <= 0 || semesterId <= 0) {
          return res.status(400).json({ message: 'Invalid studentId or semesterId' });
        }
  
        // Fetch courses for the student in the specified semester
        const coursesResult = await getCoursesByStudentAndSemester(studentId, semesterId);
        const courses = coursesResult.rows;
  
        // Get CLOs for the courses
        const courseIds = courses.map(course => course.course_id);
        const closResult = await getCLOsByCourses(courseIds);
        const clos = closResult.rows;
  
        // Get PLOs associated with these CLOs
        const cloIds = clos.map(clo => clo.clo_id);
        const ploMappingResult = await getPLOsByCLOs(cloIds);
        const ploMappings = ploMappingResult.rows;
  
        // Organize CLO to PLO mapping
        const cloPloMapping = await getCLOPLOMapping(cloIds);
        const ploStatus = {};
        const cloStatus = {};
  
        // Prepare CLO and PLO status
        ploMappings.forEach(plo => {
          ploStatus[plo.plo_id] = {
            plo_name: plo.plo_name,
            total_clos: 0,
            achieved_clos: 0
          };
        });
  
        // Process each CLO and its associated PLO
        for (const clo of clos) {
          cloStatus[clo.clo_id] = {
            clo_name: clo.clo_name,
            description: clo.description,
            course_id: clo.course_id,
            achieved: false
          };
  
          // Check if CLO is achieved
          const totalMarksQuery = `
            SELECT COALESCE(SUM(q.marks), 0) AS total_marks
            FROM questions q
            WHERE q.clo_id = $1
          `;
          const obtainedMarksQuery = `
            SELECT COALESCE(SUM(m.obtained_marks), 0) AS obtained_marks
            FROM questions q
            JOIN marks m ON q.id = m.question_id
            WHERE q.clo_id = $1 AND m.student_id = $2
          `;
  
          const totalMarksResult = await query(totalMarksQuery, [clo.clo_id]);
          const obtainedMarksResult = await query(obtainedMarksQuery, [clo.clo_id, studentId]);
  
          const totalMarks = parseFloat(totalMarksResult.rows[0].total_marks);
          const obtainedMarks = parseFloat(obtainedMarksResult.rows[0].obtained_marks);
  
          const isAchieved = (totalMarks > 0) && ((obtainedMarks / totalMarks) >= 0.5);
          cloStatus[clo.clo_id].achieved = isAchieved;
  
          // Update PLO status based on CLO achievements
          cloPloMapping.rows.forEach(mapping => {
            if (mapping.clo_id === clo.clo_id) {
              if (!ploStatus[mapping.plo_id]) {
                ploStatus[mapping.plo_id] = {
                  plo_name: 'Unknown',
                  total_clos: 0,
                  achieved_clos: 0
                };
              }
              ploStatus[mapping.plo_id].total_clos += 1;
              if (isAchieved) {
                ploStatus[mapping.plo_id].achieved_clos += 1;
              }
            }
          });
        }
  
        // Determine if PLOs are achieved
        Object.keys(ploStatus).forEach(ploId => {
          const status = ploStatus[ploId];
          status.achieved = status.total_clos === status.achieved_clos;
        });
  
        res.status(200).json({ cloStatus, ploStatus });
      } catch (error) {
        console.error('Error fetching PLO achievements:', error);
        res.status(500).json({ message: 'Error fetching PLO achievements' });
      }
  });

  
module.exports = router;

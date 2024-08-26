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

// Function to get assessments for a student
async function getStudentAssessments(studentId) {
  const queryText = `
    SELECT a.id AS assessment_id, a.course_id, a.semester_id, q.clo_id, q.marks, m.obtained_marks
    FROM assessments a
    JOIN questions q ON q.assessment_id = a.id
    JOIN marks m ON m.question_id = q.id
    WHERE m.student_id = $1
  `;
  const values = [studentId];
  return query(queryText, values);
}

// Function to get CLO details
async function getCLO(cloId) {
  const queryText = 'SELECT * FROM clos WHERE id = $1';
  return query(queryText, [cloId]);
}

// Function to get all CLOs for a course
async function getClosByCourseId(courseId) {
  const queryText = 'SELECT * FROM clos WHERE course_id = $1';
  return query(queryText, [courseId]);
}

// Function to get PLOs mapped to CLOs
async function getPLOsByCLO(cloId) {
  const queryText = `
    SELECT p.id, p.description, p.plo_name
    FROM plos p
    JOIN clo_plo_mapping cpm ON p.id = cpm.plo_id
    WHERE cpm.clo_id = $1
  `;
  return query(queryText, [cloId]);
}

// Function to check if a CLO is achieved by a student
async function isCLOAchieved(studentId, cloId) {
  const assessments = await getStudentAssessments(studentId);
  const cloDetails = await getCLO(cloId);
  const questions = assessments.rows.filter(a => a.clo_id === cloId);
  
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const obtainedMarks = questions.reduce((sum, q) => sum + q.obtained_marks, 0);
  
  return (obtainedMarks / totalMarks) >= 0.5; // Assuming 50% threshold for pass
}

// Function to get achieved and unachieved CLOs
async function getCLOAchievements(studentId) {
  const cloQuery = 'SELECT DISTINCT clo_id FROM questions';
  const clos = await query(cloQuery);

  const achievements = [];
  for (const clo of clos.rows) {
    const achieved = await isCLOAchieved(studentId, clo.clo_id);
    achievements.push({ clo_id: clo.clo_id, achieved });
  }

  return achievements;
}

// Function to get achieved and unachieved PLOs
async function getPLOAchievements(studentId) {
  const cloAchievements = await getCLOAchievements(studentId);
  const ploMap = new Map();
  
  for (const { clo_id, achieved } of cloAchievements) {
    const plos = await getPLOsByCLO(clo_id);
    for (const plo of plos.rows) {
      if (!ploMap.has(plo.id)) {
        ploMap.set(plo.id, { ...plo, achieved: true });
      }
      if (!achieved) {
        ploMap.get(plo.id).achieved = false;
      }
    }
  }

  return Array.from(ploMap.values());
}

// Route to get CLO achievements for a student
router.get("/clo-achievements/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const achievements = await getCLOAchievements(studentId);
    res.status(200).json(achievements);
  } catch (error) {
    console.error('Error fetching CLO achievements:', error);
    res.status(500).json({ message: 'Error fetching CLO achievements' });
  }
});

// Route to get PLO achievements for a student
router.get("/plo-achievements/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const achievements = await getPLOAchievements(studentId);
    res.status(200).json(achievements);
  } catch (error) {
    console.error('Error fetching PLO achievements:', error);
    res.status(500).json({ message: 'Error fetching PLO achievements' });
  }
});

// Function to get all assessments for a course
async function getAllAssessmentsByCourse(courseId) {
    const queryText = 'SELECT * FROM assessments WHERE course_id = $1';
    return query(queryText, [courseId]);
  }
  
  // Function to check for missing assessments
  async function checkMissingAssessments(studentId, semesterId, sessionId) {
    const assessments = await getStudentAssessments(studentId, semesterId, sessionId);
    const coursesWithAssessments = new Set(assessments.rows.map(a => a.course_id));
  
    const missingAssessments = [];
  
    for (const courseId of coursesWithAssessments) {
      const allAssessments = await getAllAssessmentsByCourse(courseId);
      const courseAssessments = allAssessments.rows;
  
      // Check if there are assessments missing for the course
      const requiredAssessmentTypes = ['quiz', 'assignment', 'midterm', 'terminal', 'lab_assignment', 'lab_midterm', 'lab_terminal'];
      const existingAssessmentTypes = new Set(courseAssessments.map(a => a.type));
  
      const missingTypes = requiredAssessmentTypes.filter(type => !existingAssessmentTypes.has(type));
  
      if (missingTypes.length > 0) {
        missingAssessments.push({ course_id: courseId, missing_types: missingTypes });
      }
    }
  
    return missingAssessments;
  }
  

// Function to check if a student has passed a CLO
async function checkCLOAchievement(studentId, cloId) {
    const queryText = `
      SELECT SUM(q.marks) AS total_marks, SUM(m.obtained_marks) AS obtained_marks 
      FROM questions q
      JOIN marks m ON q.id = m.question_id
      WHERE m.student_id = $1 AND q.clo_id = $2
    `;
    const values = [studentId, cloId];
    const result = await query(queryText, values);
    const { total_marks, obtained_marks } = result.rows[0];
    return obtained_marks >= total_marks * 0.5;
  }
  
  // Function to check PLO achievement based on associated CLOs
  async function checkPLOAchievement(studentId, ploId) {
    const queryText = `
      SELECT cpm.clo_id 
      FROM clo_plo_mapping cpm
      WHERE cpm.plo_id = $1
    `;
    const cloIdsResult = await query(queryText, [ploId]);
    for (const clo of cloIdsResult.rows) {
      const passed = await checkCLOAchievement(studentId, clo.clo_id);
      if (!passed) return false;
    }
    return true;
  }
  
  // Main function to get student progress
  async function getStudentProgress(studentId) {
    const enrollmentsQuery = `
      SELECT course_id 
      FROM studentenrollments 
      WHERE student_id = $1
    `;
    const enrollmentsResult = await query(enrollmentsQuery, [studentId]);
  
    const progress = [];
  
    for (const enrollment of enrollmentsResult.rows) {
      const courseId = enrollment.course_id;
  
      const closQuery = `
        SELECT id, clo_name 
        FROM clos 
        WHERE course_id = $1
      `;
      const closResult = await query(closQuery, [courseId]);
  
      const courseProgress = {
        courseId,
        clos: [],
        plos: []
      };
  
      for (const clo of closResult.rows) {
        const passed = await checkCLOAchievement(studentId, clo.id);
        courseProgress.clos.push({
          cloName: clo.clo_name,
          passed
        });
      }
  
      const plosQuery = `
        SELECT DISTINCT p.id, p.plo_name 
        FROM plos p
        JOIN clo_plo_mapping cpm ON p.id = cpm.plo_id
        JOIN clos c ON cpm.clo_id = c.id
        WHERE c.course_id = $1
      `;
      const plosResult = await query(plosQuery, [courseId]);
  
      for (const plo of plosResult.rows) {
        const passed = await checkPLOAchievement(studentId, plo.id);
        courseProgress.plos.push({
          ploName: plo.plo_name,
          passed
        });
      }
  
      progress.push(courseProgress);
    }
  
    return progress;
  }
  
  // Route handler to get student progress
  router.get("/progress/:studentId", async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const progress = await getStudentProgress(studentId);
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ message: "Error fetching student progress" });
    }
  });

  
// -----------------------------CLO and plo status for student enrolled in the semster courses:
async function checkCLOAchievement(studentId, cloId) {
    const queryText = `
        SELECT SUM(q.marks) AS total_marks, SUM(m.obtained_marks) AS obtained_marks 
        FROM questions q
        JOIN marks m ON q.id = m.question_id
        WHERE m.student_id = $1 AND q.clo_id = $2
    `;
    const values = [studentId, cloId];
    const result = await query(queryText, values);
    const { total_marks, obtained_marks } = result.rows[0];
    return obtained_marks >= total_marks * 0.5;
}

// Function to check PLO achievement based on associated CLOs
async function checkPLOAchievement(studentId, ploId) {
    const queryText = `
        SELECT cpm.clo_id 
        FROM clo_plo_mapping cpm
        WHERE cpm.plo_id = $1
    `;
    const cloIdsResult = await query(queryText, [ploId]);
    for (const clo of cloIdsResult.rows) {
        const passed = await checkCLOAchievement(studentId, clo.clo_id);
        if (!passed) return false;
    }
    return true;
}

// Function to get student progress for a specific semester
async function getStudentProgressForSemester(studentId, semesterId) {
    const coursesQuery = `
        SELECT c.id AS course_id, c.name 
        FROM courses c
        JOIN studentenrollments se ON c.id = se.course_id
        WHERE se.student_id = $1 AND se.semester_id = $2
    `;
    const coursesResult = await query(coursesQuery, [studentId, semesterId]);

    const progress = [];

    for (const course of coursesResult.rows) {
        const { course_id, course_name } = course;

        const closQuery = `
            SELECT id, clo_name 
            FROM clos 
            WHERE course_id = $1
        `;
        const closResult = await query(closQuery, [course_id]);

        const courseProgress = {
            courseName: course_name,
            achievedCLOs: [],
            notAchievedCLOs: [],
            achievedPLOs: [],
            notAchievedPLOs: []
        };

        if (closResult.rows.length === 0) {
            courseProgress.noCLOs = true;
            courseProgress.noPLOs = true;
            progress.push(courseProgress);
            continue;
        }

        for (const clo of closResult.rows) {
            const passed = await checkCLOAchievement(studentId, clo.id);
            if (passed) {
                courseProgress.achievedCLOs.push(clo.clo_name);
            } else {
                courseProgress.notAchievedCLOs.push(clo.clo_name);
            }
        }

        const plosQuery = `
            SELECT DISTINCT p.id, p.plo_name 
            FROM plos p
            JOIN clo_plo_mapping cpm ON p.id = cpm.plo_id
            JOIN clos c ON cpm.clo_id = c.id
            WHERE c.course_id = $1
        `;
        const plosResult = await query(plosQuery, [course_id]);

        for (const plo of plosResult.rows) {
            const passed = await checkPLOAchievement(studentId, plo.id);
            if (passed) {
                courseProgress.achievedPLOs.push(plo.plo_name);
            } else {
                courseProgress.notAchievedPLOs.push(plo.plo_name);
            }
        }

        progress.push(courseProgress);
    }

    return progress;
}

// Route handler to get student progress for a specific semester
router.get("/progress/:studentId/:semesterId", async (req, res) => {
    try {
        const { studentId, semesterId } = req.params;
        const progress = await getStudentProgressForSemester(studentId, semesterId);
        res.status(200).json(progress);
    } catch (error) {
        console.error("Error fetching student progress:", error.message, error.stack);
        res.status(500).json({ message: "Error fetching student progress", error: error.message });
    }
});

module.exports = router;

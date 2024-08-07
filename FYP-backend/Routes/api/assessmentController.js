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

// Helper function to calculate CLO progress
const calculateCLOProgress = async (courseId, studentId) => {
  try {
    // Get all CLOs for the course, filtering out rows where clo_id is NULL
    const { rows: cloTotals } = await query(`
      SELECT q.clo_id, SUM(q.marks) AS total_marks
      FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      WHERE a.course_id = $1
      AND q.clo_id IS NOT NULL
      GROUP BY q.clo_id
    `, [courseId]);

    if (cloTotals.length === 0) {
      return { message: "No CLOs found for this course." };
    }

    // Get all student marks, filtering out rows where clo_id is NULL
    const { rows: studentMarks } = await query(`
      SELECT q.clo_id, SUM(m.obtained_marks) AS obtained_marks
      FROM marks m
      JOIN questions q ON m.question_id = q.id
      JOIN assessments a ON q.assessment_id = a.id
      WHERE m.student_id = $1
      AND a.course_id = $2
      AND q.clo_id IS NOT NULL
      GROUP BY q.clo_id
    `, [studentId, courseId]);

    // Calculate pass/fail status
    const results = cloTotals.map(cloTotal => {
      const studentMark = studentMarks.find(mark => mark.clo_id === cloTotal.clo_id) || { obtained_marks: 0 };
      return {
        clo_id: cloTotal.clo_id,
        total_marks: cloTotal.total_marks,
        obtained_marks: studentMark.obtained_marks,
        status: (studentMark.obtained_marks >= (cloTotal.total_marks * 0.5)) ? 'Pass' : 'Fail'
      };
    });

    return results;
  } catch (error) {
    console.error('Error calculating CLO progress:', error);
    throw new Error('Error calculating CLO progress');
  }
};

// Endpoint to check if all CLOs have assessments for a course
router.get('/checkCLOs/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    // Get all CLOs for the course from the `clos` table
    const { rows: allCLOs } = await query(`
      SELECT id
      FROM clos
      WHERE course_id = $1
    `, [courseId]);

    // Get all CLOs for the course that have questions
    const { rows: cloCounts } = await query(`
      SELECT q.clo_id
      FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      WHERE a.course_id = $1
      GROUP BY q.clo_id
    `, [courseId]);

    // Check if all CLOs have assessments
    const missingCLOs = allCLOs.filter(clo => !cloCounts.some(count => count.clo_id === clo.id));

    if (missingCLOs.length > 0) {
      return res.status(400).json({ message: 'Not all CLOs have assessments', missingCLOs });
    }

    res.status(200).json({ message: 'All CLOs have assessments' });
  } catch (error) {
    console.error('Error checking CLOs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to calculate CLO progress for a student
router.get('/cloProgress/:courseId/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;
  try {
    const progress = await calculateCLOProgress(courseId, studentId);
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Helper function to calculate CLO progress for a student
const calculateStudentCLOProgress = async (courseId, studentId) => {
  try {
    // Get all CLOs for the course
    const { rows: allCLOs } = await query(`
      SELECT id, clo_name
      FROM clos
      WHERE course_id = $1
    `, [courseId]);

    if (allCLOs.length === 0) {
      return { message: "No CLOs found for this course." };
    }

    // Get all questions and their marks for the course
    const { rows: cloTotals } = await query(`
      SELECT clo_id, SUM(marks) AS total_marks
      FROM questions
      WHERE assessment_id IN (SELECT id FROM assessments WHERE course_id = $1)
      GROUP BY clo_id
    `, [courseId]);

    // Get all student marks for the course
    const { rows: studentMarks } = await query(`
      SELECT q.clo_id, SUM(m.obtained_marks) AS obtained_marks
      FROM marks m
      JOIN questions q ON m.question_id = q.id
      WHERE m.student_id = $1
      AND q.assessment_id IN (SELECT id FROM assessments WHERE course_id = $2)
      GROUP BY q.clo_id
    `, [studentId, courseId]);

    // Calculate pass/fail status
    const results = allCLOs.map(clo => {
      const cloTotal = cloTotals.find(total => total.clo_id === clo.id) || { total_marks: 0 };
      const studentMark = studentMarks.find(mark => mark.clo_id === clo.id) || { obtained_marks: 0 };
      return {
        clo_id: clo.id,
        clo_name: clo.clo_name,
        total_marks: cloTotal.total_marks,
        obtained_marks: studentMark.obtained_marks,
        status: (cloTotal.total_marks > 0 && studentMark.obtained_marks >= (cloTotal.total_marks * 0.5)) ? 'Pass' : (cloTotal.total_marks > 0 ? 'Fail' : 'Pending')
      };
    });

    return results;
  } catch (error) {
    console.error('Error calculating CLO progress:', error);
    throw new Error('Error calculating CLO progress');
  }
};

// Endpoint to calculate CLO progress for a student
router.get('/cloProgress/:courseId/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;
  try {
    const progress = await calculateStudentCLOProgress(courseId, studentId);
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
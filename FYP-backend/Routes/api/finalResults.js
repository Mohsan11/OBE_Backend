const express = require('express');
const router = express.Router();
const db = require('../../db');

router.get('/:studentId/:semester', async (req, res) => {
  const { studentId, semester } = req.params;

  try {
    // Query to get course details and marks
    const resultsQuery = `
      SELECT 
        c.course_code AS courseNumber,
        c.course_title AS courseTitle,
        c.credit_hours AS creditHours,
        m.marks AS marks,
        CASE 
          WHEN m.marks >= 85 THEN 'A'
          WHEN m.marks >= 80 THEN 'A-'
          WHEN m.marks >= 75 THEN 'B+'
          WHEN m.marks >= 70 THEN 'B'
          WHEN m.marks >= 65 THEN 'B-'
          WHEN m.marks >= 60 THEN 'C+'
          WHEN m.marks >= 55 THEN 'C'
          WHEN m.marks >= 50 THEN 'C-'
          ELSE 'F'
        END AS letterGrade,
        CASE 
          WHEN m.marks >= 85 THEN 4.0
          WHEN m.marks >= 80 THEN 3.7
          WHEN m.marks >= 75 THEN 3.3
          WHEN m.marks >= 70 THEN 3.0
          WHEN m.marks >= 65 THEN 2.7
          WHEN m.marks >= 60 THEN 2.3
          WHEN m.marks >= 55 THEN 2.0
          WHEN m.marks >= 50 THEN 1.7
          ELSE 0.0
        END AS gradePoints,
        (c.credit_hours * CASE 
          WHEN m.marks >= 85 THEN 4.0
          WHEN m.marks >= 80 THEN 3.7
          WHEN m.marks >= 75 THEN 3.3
          WHEN m.marks >= 70 THEN 3.0
          WHEN m.marks >= 65 THEN 2.7
          WHEN m.marks >= 60 THEN 2.3
          WHEN m.marks >= 55 THEN 2.0
          WHEN m.marks >= 50 THEN 1.7
          ELSE 0.0
        END) AS creditPoints
      FROM 
        enrollments e
      JOIN 
        courses c ON e.course_id = c.course_id
      JOIN 
        marks m ON e.enrollment_id = m.enrollment_id
      WHERE 
        e.student_id = $1 AND e.semester = $2
    `;

    const { rows } = await db.query(resultsQuery, [studentId, semester]);

    // Calculate total GPA for the semester
    const totalCredits = rows.reduce((acc, row) => acc + parseFloat(row.credithours), 0);
    const totalCreditPoints = rows.reduce((acc, row) => acc + parseFloat(row.creditpoints), 0);
    const gpa = (totalCreditPoints / totalCredits).toFixed(2);

    res.json({
      semesterNumber: semester,
      courses: rows.map(row => ({
        courseNumber: row.coursenumber,
        courseTitle: row.coursetitle,
        creditHours: row.credithours,
        marks: row.marks,
        letterGrade: row.lettergrade,
        gradePoints: row.gradepoints,
        creditPoints: row.creditpoints,
      })),
      gpa: gpa
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

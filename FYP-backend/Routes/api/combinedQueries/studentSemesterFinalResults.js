const express = require("express");
const { pool } = require("../../../db"); // Adjust the path as necessary
const router = express.Router();

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// Function to fetch courses for a student in a given semester
async function getCoursesForStudent(studentId, semesterId) {
  const queryText = `
    SELECT c.id as course_id, c.name as course_name, c.theory_credit_hours, c.lab_credit_hours 
    FROM courses c
    JOIN studentenrollments se ON c.id = se.course_id
    WHERE se.student_id = $1 AND se.semester_id = $2
  `;
  return query(queryText, [studentId, semesterId]);
}

// Function to fetch assessments for a given course in a given semester
async function getAssessmentsForCourse(courseId, semesterId) {
  const queryText = `
    SELECT a.id as assessment_id, a.assessment_name, a.assessment_type, a.normalized_total_marks 
    FROM assessments a
    WHERE a.course_id = $1 AND a.semester_id = $2
  `;
  return query(queryText, [courseId, semesterId]);
}

// Function to fetch final total and obtained marks for a student in a specific assessment
async function getResultForAssessment(studentId, assessmentId) {
  const queryText = `
    SELECT r.final_total_marks, r.final_obtained_marks
    FROM result r
    WHERE r.student_id = $1 AND r.assessment_id = $2
  `;
  const result = await query(queryText, [studentId, assessmentId]);
  return result.rows[0]; // Returns an object with final_total_marks and final_obtained_marks
}

// Function to calculate grade based on total and obtained marks
function calculateGrade(obtainedMarks, totalMarks) {
  const percentage = (obtainedMarks / totalMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
}

// Function to calculate GPA based on obtained marks and credit hours
function calculateGPA(obtainedMarks, totalMarks, creditHours) {
  const percentage = (obtainedMarks / totalMarks) * 100;
  let gpa = 0;
  if (percentage >= 90) gpa = 4.0;
  else if (percentage >= 80) gpa = 3.7;
  else if (percentage >= 70) gpa = 3.3;
  else if (percentage >= 60) gpa = 3.0;
  else if (percentage >= 50) gpa = 2.7;
  else if (percentage >= 40) gpa = 2.0;
  else gpa = 0.0;
  return gpa;
}

// Expected assessments structure based on credit hours
const expectedAssessmentsByCreditHours = {
  '3-0': [
    { name: 'Quiz', type: 'quiz', marks: 15 },
    { name: 'Assignment', type: 'assignment', marks: 15 },
    { name: 'Midterm', type: 'midterm', marks: 45 },
    { name: 'Terminal', type: 'terminal', marks: 75 },
    { total: 150 }
  ],
  '3-1': [
    { name: 'Theory Quiz', type: 'quiz', marks: 15 },
    { name: 'Theory Assignment', type: 'assignment', marks: 15 },
    { name: 'Theory Midterm', type: 'midterm', marks: 45 },
    { name: 'Theory Terminal', type: 'terminal', marks: 75 },
    { name: 'Lab Assignment', type: 'lab_assignment', marks: 12.5 },
    { name: 'Lab Midterm', type: 'lab_midterm', marks: 12.5 },
    { name: 'Lab Terminal', type: 'lab_terminal', marks: 25 },
    { total: 200 }
  ],
  '2-1': [
    { name: 'Theory Quiz', type: 'quiz', marks: 10 },
    { name: 'Theory Assignment', type: 'assignment', marks: 10 },
    { name: 'Theory Midterm', type: 'midterm', marks: 30 },
    { name: 'Theory Terminal', type: 'terminal', marks: 50 },
    { name: 'Lab Assignment', type: 'lab_assignment', marks: 12.5 },
    { name: 'Lab Midterm', type: 'lab_midterm', marks: 12.5 },
    { name: 'Lab Terminal', type: 'lab_terminal', marks: 25 },
    { total: 150 }
  ]
};

// Route to fetch final semester results for a student
router.get('/final/:studentId/semester/:semesterId', async (req, res) => {
  const { studentId, semesterId } = req.params;

  try {
    // Fetch all courses for the given student and semester
    const coursesResult = await getCoursesForStudent(studentId, semesterId);
    if (coursesResult.rows.length === 0) {
      return res.status(404).json({ error: 'No courses found for the specified semester.' });
    }

    const results = [];

    for (const course of coursesResult.rows) {
      const { course_id, course_name, theory_credit_hours, lab_credit_hours } = course;

      // Determine the credit hours key
      const creditHoursKey = `${theory_credit_hours}-${lab_credit_hours}`;

      // Get expected assessments based on the credit hours configuration
      const expectedAssessments = expectedAssessmentsByCreditHours[creditHoursKey];

      if (!expectedAssessments) {
        results.push({
          course_id,
          course_name,
          message: 'No expected assessment structure found for this course credit hour configuration.',
        });
        continue;
      }

      // Fetch all assessments for the course
      const assessmentsResult = await getAssessmentsForCourse(course_id, semesterId);

      const assessmentsMap = new Map();
      assessmentsResult.rows.forEach(assessment => {
        assessmentsMap.set(assessment.assessment_type, {
          id: assessment.assessment_id,
          name: assessment.assessment_name,
          type: assessment.assessment_type,
          normalized_total_marks: assessment.normalized_total_marks,
        });
      });

      const courseResults = {
        course_id,
        course_name,
        assessments: [],
        total_marks: 0,
        obtained_marks: 0,
        grade: '',
        gpa: 0,
        credit_hours: theory_credit_hours + lab_credit_hours,
      };

      let allAssessmentsExist = true;

      // Check if all expected assessments exist
      for (const expected of expectedAssessments) {
        if (expected.total) {
          courseResults.total_marks = expected.total;
        } else {
          const assessment = assessmentsMap.get(expected.type);
          if (assessment) {
            // Fetch the obtained and total marks for this assessment
            const result = await getResultForAssessment(studentId, assessment.id);
            if (result) {
              courseResults.assessments.push({
                id: assessment.id,
                name: assessment.name,
                type: assessment.type,
                total_marks: result.final_total_marks,
                obtained_marks: parseFloat(result.final_obtained_marks).toFixed(1),
              });
              courseResults.total_marks += result.final_total_marks;
              courseResults.obtained_marks += parseFloat(result.final_obtained_marks);
            }
          } else {
            allAssessmentsExist = false;
          }
        }
      }
      
      courseResults.obtained_marks = parseFloat(courseResults.obtained_marks).toFixed(2);
      courseResults.grade = calculateGrade(parseFloat(courseResults.obtained_marks), courseResults.total_marks);
      courseResults.gpa = calculateGPA(parseFloat(courseResults.obtained_marks), courseResults.total_marks, courseResults.credit_hours);

      if (!allAssessmentsExist) {
        courseResults.message = 'Some assessments have not been created yet.';
      }

      results.push(courseResults);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching final results:', error);
    res.status(500).json({ error: 'Failed to fetch final results' });
  }
});

module.exports = router;

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

const calculateNormalizedMarks = (theoryCreditHours, labCreditHours, assessmentType) => {
  let totalMarks = 0;
  let normalizedMarks = 0;

  if (theoryCreditHours === 3 && labCreditHours === 0) {
    switch (assessmentType) {
      case 'quiz':
      case 'assignment':
        normalizedMarks = 15;
        totalMarks = 150;
        break;
      case 'midterm':
        normalizedMarks = 45;
        totalMarks = 150;
        break;
      case 'terminal':
        normalizedMarks = 75;
        totalMarks = 150;
        break;
      default:
        break;
    }
  } else if (theoryCreditHours === 3 && labCreditHours === 1) {
    switch (assessmentType) {
      case 'quiz':
      case 'assignment':
        normalizedMarks = 15;
        totalMarks = 200;
        break;
      case 'midterm':
        normalizedMarks = 45;
        totalMarks = 200;
        break;
      case 'terminal':
        normalizedMarks = 75;
        totalMarks = 200;
        break;
      case 'lab_assignment':
      case 'lab_midterm':
        normalizedMarks = 12.5;
        totalMarks = 200;
        break;
      case 'lab_terminal':
        normalizedMarks = 25;
        totalMarks = 200;
        break;
      default:
        break;
    }
  } else if (theoryCreditHours === 2 && labCreditHours === 1) {
    switch (assessmentType) {
      case 'quiz':
      case 'assignment':
        normalizedMarks = 10;
        totalMarks = 150;
        break;
      case 'midterm':
        normalizedMarks = 30;
        totalMarks = 150;
        break;
      case 'terminal':
        normalizedMarks = 50;
        totalMarks = 150;
        break;
      case 'lab_assignment':
      case 'lab_midterm':
        normalizedMarks = 12.5;
        totalMarks = 150;
        break;
      case 'lab_terminal':
        normalizedMarks = 25;
        totalMarks = 150;
        break;
      default:
        break;
    }
  }

  return { normalizedMarks, totalMarks };
};


async function updateMarksAndResults(assessmentId, newNormalizedMarks) {
  // Fetch all marks for the assessment
  const marksResult = await query('SELECT * FROM marks WHERE assessment_id = $1', [assessmentId]);

  if (marksResult.rows.length === 0) {
    console.log(`No marks found for assessment ID ${assessmentId}`);
    return;
  }

  // Sum obtained marks and total marks from marks table
  const { sumObtainedMarks, sumTotalMarks } = marksResult.rows.reduce(
    (acc, mark) => {
      acc.sumObtainedMarks += mark.obtained_marks;
      acc.sumTotalMarks += mark.total_marks;
      return acc;
    },
    { sumObtainedMarks: 0, sumTotalMarks: 0 }
  );

  // Calculate new normalized obtained marks
  const normalizedObtainedMarks = (sumObtainedMarks / sumTotalMarks) * newNormalizedMarks;

  // Update result table with new normalized obtained marks and total marks
  await query('UPDATE result SET final_total_marks = $1, final_obtained_marks = $2 WHERE assessment_id = $3', [newNormalizedMarks, normalizedObtainedMarks, assessmentId]);

  console.log(`Results updated for assessment ID ${assessmentId}`);
}

async function createAssessment(assessment) {
  const { assessment_name, assessment_type, course_id, semester_id } = assessment;

  const courseResult = await query('SELECT * FROM courses WHERE id = $1', [course_id]);
  if (courseResult.rows.length === 0) {
    throw new Error('Course not found');
  }
  const course = courseResult.rows[0];
  const theoryCreditHours = course.theory_credit_hours;
  const labCreditHours = course.lab_credit_hours;

  const { normalizedMarks, totalMarks } = calculateNormalizedMarks(theoryCreditHours, labCreditHours, assessment_type);

  const assessmentsResult = await query('SELECT * FROM assessments WHERE course_id = $1 AND assessment_type = $2', [course_id, assessment_type]);
  const numberOfExistingAssessments = assessmentsResult.rows.length + 1;

  const adjustedNormalizedMarks = normalizedMarks / numberOfExistingAssessments;

  await Promise.all(
    assessmentsResult.rows.map(async (existingAssessment) => {
      await query('UPDATE assessments SET normalized_total_marks = $1 WHERE id = $2', [adjustedNormalizedMarks, existingAssessment.id]);
      await updateMarksAndResults(existingAssessment.id, adjustedNormalizedMarks);
    })
  );

  const queryText = 'INSERT INTO assessments (assessment_name, assessment_type, course_id, semester_id, normalized_total_marks) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [assessment_name, assessment_type, course_id, semester_id, adjustedNormalizedMarks];
  return query(queryText, values);
}

async function deleteAssessment(assessmentId) {
  // Fetch the assessment to be deleted
  const assessmentResult = await query('SELECT * FROM assessments WHERE id = $1', [assessmentId]);
  if (assessmentResult.rows.length === 0) {
    throw new Error('Assessment not found');
  }
  const assessment = assessmentResult.rows[0];

  // Fetch the course details to get credit hours
  const courseResult = await query('SELECT * FROM courses WHERE id = $1', [assessment.course_id]);
  if (courseResult.rows.length === 0) {
    throw new Error('Course not found');
  }
  const course = courseResult.rows[0];
  const theoryCreditHours = course.theory_credit_hours;
  const labCreditHours = course.lab_credit_hours;

  // Fetch remaining assessments of the same type for the course (excluding the one to be deleted)
  const remainingAssessmentsResult = await query(
    'SELECT * FROM assessments WHERE course_id = $1 AND assessment_type = $2 AND id != $3',
    [assessment.course_id, assessment.assessment_type, assessmentId]
  );
  const numberOfRemainingAssessments = remainingAssessmentsResult.rows.length;

  // Calculate the normalized marks for the remaining assessments
  const { normalizedMarks, totalMarks } = calculateNormalizedMarks(theoryCreditHours, labCreditHours, assessment.assessment_type);

  if (numberOfRemainingAssessments > 0) {
    const adjustedNormalizedMarks = normalizedMarks / numberOfRemainingAssessments;

    await Promise.all(
      remainingAssessmentsResult.rows.map(async (remainingAssessment) => {
        await query('UPDATE assessments SET normalized_total_marks = $1 WHERE id = $2', [adjustedNormalizedMarks, remainingAssessment.id]);
        await updateMarksAndResults(remainingAssessment.id, adjustedNormalizedMarks);
      })
    );
  }

  // Delete related questions, marks, and results
  await query('DELETE FROM marks WHERE assessment_id = $1', [assessmentId]);
  await query('DELETE FROM questions WHERE assessment_id = $1', [assessmentId]);
  await query('DELETE FROM result WHERE assessment_id = $1', [assessmentId]);

  // Delete the assessment
  const deleteQueryText = 'DELETE FROM assessments WHERE id = $1';
  return query(deleteQueryText, [assessmentId]);
}

async function getAssessment(assessmentId) {
  const queryText = 'SELECT * FROM assessments WHERE id = $1';
  return query(queryText, [assessmentId]);
}

async function updateAssessment(assessmentId, updates) {
  const { assessment_name, assessment_type } = updates;
  const queryText = 'UPDATE assessments SET assessment_name = $1, assessment_type = $2 WHERE id = $3 RETURNING *';
  const values = [assessment_name, assessment_type, assessmentId];
  return query(queryText, values);
}

async function getAllAssessments() {
  const queryText = 'SELECT * FROM assessments';
  return query(queryText, []);
}

router.get("/all", async (req, res) => {
  try {
    const result = await getAllAssessments();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createAssessment(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating assessment:', err);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await getAssessment(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const result = await updateAssessment(req.params.id, req.body);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteAssessment(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM assessments WHERE course_id = $1`,
      [courseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.get('/marks/assessment/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const queryText = 'SELECT * FROM marks WHERE assessment_id = $1';
    const result = await query(queryText, [assessmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Error fetching marks' });
  }
});

router.get('/assessments/:assessmentId/details', async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const result = await db.query(`
      SELECT q.question_text, q.marks AS total_marks, m.obtained_marks
      FROM public.questions q
      JOIN public.marks m ON q.id = m.question_id
      WHERE m.assessment_id = $1
    `, [assessmentId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// -----------------Combined queries
async function deleteAssessment(assessmentId) {
  // Fetch the assessment to be deleted
  const assessmentResult = await query('SELECT * FROM assessments WHERE id = $1', [assessmentId]);
  if (assessmentResult.rows.length === 0) {
    throw new Error('Assessment not found');
  }
  const assessment = assessmentResult.rows[0];

  // Fetch the course details to get credit hours
  const courseResult = await query('SELECT * FROM courses WHERE id = $1', [assessment.course_id]);
  if (courseResult.rows.length === 0) {
    throw new Error('Course not found');
  }
  const course = courseResult.rows[0];
  const theoryCreditHours = course.theory_credit_hours;
  const labCreditHours = course.lab_credit_hours;

  // Fetch remaining assessments of the same type for the course (excluding the one to be deleted)
  const remainingAssessmentsResult = await query(
    'SELECT * FROM assessments WHERE course_id = $1 AND assessment_type = $2 AND id != $3',
    [assessment.course_id, assessment.assessment_type, assessmentId]
  );
  const numberOfRemainingAssessments = remainingAssessmentsResult.rows.length;

  // Calculate the normalized marks for the remaining assessments
  const { normalizedMarks, totalMarks } = calculateNormalizedMarks(theoryCreditHours, labCreditHours, assessment.assessment_type);

  if (numberOfRemainingAssessments > 0) {
    const adjustedNormalizedMarks = normalizedMarks / numberOfRemainingAssessments;

    await Promise.all(
      remainingAssessmentsResult.rows.map(async (remainingAssessment) => {
        await query('UPDATE assessments SET normalized_total_marks = $1 WHERE id = $2', [adjustedNormalizedMarks, remainingAssessment.id]);
        await updateMarksAndResults(remainingAssessment.id, adjustedNormalizedMarks);
      })
    );
  }

  // Delete related marks, questions, and results
  await query('DELETE FROM marks WHERE assessment_id = $1', [assessmentId]);
  await query('DELETE FROM questions WHERE assessment_id = $1', [assessmentId]);
  await query('DELETE FROM result WHERE assessment_id = $1', [assessmentId]);

  // Delete the assessment
  const deleteQueryText = 'DELETE FROM assessments WHERE id = $1';
  return query(deleteQueryText, [assessmentId]);
}

router.delete("/deleteassessment/:id", async (req, res) => {
  try {
    await deleteAssessment(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

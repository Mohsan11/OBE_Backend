const { pool } = require("./db"); // Import the database connection pool

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query:", { text, duration, rows: res.rowCount });
  return res;
}

// CRUD functions for Assesment table

async function createAssesment(assesment, query) {
  const { assesment_Type, assesment_Q_no } = assesment;
  const queryText =
    'INSERT INTO public."Assesment"("Assesment_Type", "Assesment_Q_No") VALUES($1, $2) RETURNING *';
  const values = [assesment_Type, assesment_Q_no];
  return query(queryText, values);
}

async function getAssesment(assesmentID) {
  const queryText =
    'SELECT * FROM public."Assesment" WHERE "Assesment_ID" = $1';
  return query(queryText, [assesmentID]);
}

async function updateAssesment(assesmentID, updates) {
  const queryText =
    'UPDATE public."Assesment" SET "Assesment_Type" = $1, "Assesment_Q_No" = $2 WHERE "Assesment_ID" = $3 RETURNING *';
  const values = [updates.assesment_type, updates.assesment_q_no, assesmentID];
  return query(queryText, values);
}

async function deleteAssesment(assesmentID) {
  const queryText = 'DELETE FROM public."Assesment" WHERE "Assesment_ID" = $1';
  return query(queryText, [assesmentID]);
}

// CRUD functions for CLO table
async function createCLO(clo) {
  const { clo_description } = clo;
  const queryText =
    'INSERT INTO public."CLO"("CLO_Description") VALUES($1) RETURNING *';
  const values = [clo_description];
  return query(queryText, values);
}

async function getCLO(cloID) {
  const queryText = 'SELECT * FROM public."CLO" WHERE "CLO_ID" = $1';
  return query(queryText, [cloID]);
}

async function updateCLO(cloID, updates) {
  const queryText =
    'UPDATE public."CLO" SET "CLO_Description" = $1 WHERE "CLO_ID" = $2 RETURNING *';
  const values = [updates.clo_description, cloID];
  return query(queryText, values);
}

async function deleteCLO(cloID) {
  const queryText = 'DELETE FROM public."CLO" WHERE "CLO_ID" = $1';
  return query(queryText, [cloID]);
}

// CRUD functions for Department table
async function createDepartment(department) {
  const { dep_name, dep_code } = department;
  const queryText =
    'INSERT INTO public."Department"("Dep_Name", "Dep_Code") VALUES( $1,$2) RETURNING *';
  const values = [dep_name, dep_code];
  return query(queryText, values);
}

async function getDepartment(depID) {
  const queryText = 'SELECT * FROM public."Department" WHERE "Dep_ID" = $1';
  return query(queryText, [depID]);
}

async function updateDepartment(depID, updates) {
  const queryText =
    'UPDATE public."Department" SET "Dep_Name" = $1, "Dep_Code" = $2 WHERE "Dep_ID" = $3 RETURNING *';
  const values = [updates.dep_name, updates.dep_code, depID];
  return query(queryText, values);
}

async function deleteDepartment(depID) {
  const queryText = 'DELETE FROM public."Department" WHERE "Dep_ID" = $1';
  return query(queryText, [depID]);
}

// CRUD functions for Marks table
async function createMarks(marks) {
  const { marks_value } = marks;
  const queryText =
    'INSERT INTO public."Marks"("Marks_Value") VALUES($1) RETURNING *';
  const values = [marks_value];
  return query(queryText, values);
}

async function getMarks(marksID) {
  const queryText = 'SELECT * FROM public."Marks" WHERE "Marks_ID" = $1';
  return query(queryText, [marksID]);
}

async function updateMarks(marksID, updates) {
  const queryText =
    'UPDATE public."Marks" SET "Marks_Value" = $1 WHERE "Marks_ID" = $2 RETURNING *';
  const values = [updates.marks_value, marksID];
  return query(queryText, values);
}

async function deleteMarks(marksID) {
  const queryText = 'DELETE FROM public."Marks" WHERE "Marks_ID" = $1';
  return query(queryText, [marksID]);
}
// CRUD functions for PLO table
async function createPLO(plo) {
  const { plo_description } = plo;
  const queryText =
    'INSERT INTO public."PLO"("PLO_Description") VALUES($1) RETURNING *';
  const values = [plo_description];
  return query(queryText, values);
}

async function getPLO(ploID) {
  const queryText = 'SELECT * FROM public."PLO" WHERE "PLO_ID" = $1';
  return query(queryText, [ploID]);
}

async function updatePLO(ploID, updates) {
  const queryText =
    'UPDATE public."PLO" SET "PLO_Description" = $1 WHERE "PLO_ID" = $2 RETURNING *';
  const values = [updates.plo_description, ploID];
  return query(queryText, values);
}

async function deletePLO(ploID) {
  const queryText = 'DELETE FROM public."PLO" WHERE "PLO_ID" = $1';
  return query(queryText, [ploID]);
}

// CRUD functions for Program table
async function createProgram(program) {
  const { prog_name, prog_code, dep_id } = program;
  const queryText =
    'INSERT INTO public."Program"("Prog_Name", "Prog_Code", "Dep_ID") VALUES($1, $2, $3) RETURNING *';
  const values = [prog_name, prog_code, dep_id];
  return query(queryText, values);
}

async function getProgram(progID) {
  const queryText = 'SELECT * FROM public."Program" WHERE "Prog_ID" = $1';
  return query(queryText, [progID]);
}

async function updateProgram(progID, updates) {
  const queryText =
    'UPDATE public."Program" SET "Prog_Name" = $1, "Prog_Code" = $2 WHERE "Prog_ID" = $3 RETURNING *';
  const values = [updates.prog_name, updates.prog_code, progID];
  return query(queryText, values);
}

async function deleteProgram(progID) {
  const queryText = 'DELETE FROM public."Program" WHERE "Prog_ID" = $1';
  return query(queryText, [progID]);
}

// CRUD functions for Student table
async function createStudent(student) {
  const { std_name, prog_id } = student;
  const queryText =
    'INSERT INTO public."Student"("Std_Name", "Prog_ID") VALUES($1, $2) RETURNING *';
  const values = [std_name, prog_id];
  return query(queryText, values);
}

async function getStudent(stdID) {
  const queryText = 'SELECT * FROM public."Student" WHERE "Std_ID" = $1';
  return query(queryText, [stdID]);
}

async function updateStudent(stdID, updates) {
  const queryText =
    'UPDATE public."Student" SET "Std_Name" = $1 WHERE "Std_ID" = $2 RETURNING *';
  const values = [updates.std_name, stdID];
  return query(queryText, values);
}

async function deleteStudent(stdID) {
  const queryText = 'DELETE FROM public."Student" WHERE "Std_ID" = $1';
  return query(queryText, [stdID]);
}

// CRUD functions for StudentCLOStatus table
async function createStudentCLOStatus(status) {
  const { std_id, clo_id, clo_status } = status;
  const queryText =
    'INSERT INTO public."StudentCLOStatus"("Std_ID", "CLO_ID", "Clo_Status") VALUES($1, $2, $3) RETURNING *';
  const values = [std_id, clo_id, clo_status];
  return query(queryText, values);
}

async function getStudentCLOStatus(stdID, cloID) {
  const queryText =
    'SELECT * FROM public."StudentCLOStatus" WHERE "Std_ID" = $1 AND "CLO_ID" = $2';
  return query(queryText, [stdID, cloID]);
}

async function updateStudentCLOStatus(stdID, cloID, updates) {
  const queryText =
    'UPDATE public."StudentCLOStatus" SET "Clo_Status" = $1 WHERE "Std_ID" = $2 AND "CLO_ID" = $3 RETURNING *';
  const values = [updates.clo_status, stdID, cloID];
  return query(queryText, values);
}

async function deleteStudentCLOStatus(stdID, cloID) {
  const queryText =
    'DELETE FROM public."StudentCLOStatus" WHERE "Std_ID" = $1 AND "CLO_ID" = $2';
  return query(queryText, [stdID, cloID]);
}

// CRUD functions for StudentPLOStatus table
async function createStudentPLOStatus(status) {
  const { std_id, plo_id, plo_status } = status;
  const queryText =
    'INSERT INTO public."StudentPLOStatus"("Std_ID", "PLO_ID", "PLO_Status") VALUES($1, $2, $3) RETURNING *';
  const values = [std_id, plo_id, plo_status];
  return query(queryText, values);
}

async function getStudentPLOStatus(stdID, ploID) {
  const queryText =
    'SELECT * FROM public."StudentPLOStatus" WHERE "Std_ID" = $1 AND "PLO_ID" = $2';
  return query(queryText, [stdID, ploID]);
}

async function updateStudentPLOStatus(stdID, ploID, updates) {
  const queryText =
    'UPDATE public."StudentPLOStatus" SET "PLO_Status" = $1 WHERE "Std_ID" = $2 AND "PLO_ID" = $3 RETURNING *';
  const values = [updates.plo_status, stdID, ploID];
  return query(queryText, values);
}

async function deleteStudentPLOStatus(stdID, ploID) {
  const queryText =
    'DELETE FROM public."StudentPLOStatus" WHERE "Std_ID" = $1 AND "PLO_ID" = $2';
  return query(queryText, [stdID, ploID]);
}

// CRUD functions for Teacher table
async function createTeacher(teacher) {
  const { teacher_name } = teacher;
  const queryText =
    'INSERT INTO public."Teacher"("Teacher_Name") VALUES($1) RETURNING *';
  const values = [teacher_name];
  return query(queryText, values);
}

async function getTeacher(teacherID) {
  const queryText = 'SELECT * FROM public."Teacher" WHERE "Teacher_ID" = $1';
  return query(queryText, [teacherID]);
}

async function updateTeacher(teacherID, updates) {
  const queryText =
    'UPDATE public."Teacher" SET "Teacher_Name" = $1 WHERE "Teacher_ID" = $2 RETURNING *';
  const values = [updates.teacher_name, teacherID];
  return query(queryText, values);
}

async function deleteTeacher(teacherID) {
  const queryText = 'DELETE FROM public."Teacher" WHERE "Teacher_ID" = $1';
  return query(queryText, [teacherID]);
}

module.exports = {
  createDepartment,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};

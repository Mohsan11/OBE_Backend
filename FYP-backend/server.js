const express = require("express");
const app = express();
const cors = require("cors");
const { pool } = require("./db"); // Import the pool from db.js

require("dotenv").config();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4000;

app.use("/api/users", require("./Routes/api/users"));
app.use("/api/students", require("./Routes/api/students"));
app.use("/api/programs", require("./Routes/api/programs"));
app.use("/api/courses", require("./Routes/api/courses"));
app.use("/api/session", require("./Routes/api/sessions"));
app.use("/api/totals", require("./Routes/api/Totals"));
app.use("/api/semester", require("./Routes/api/semesters"));
app.use("/api/plo", require("./Routes/api/plo"));
app.use("/api/clo", require("./Routes/api/clos"));
app.use("/api/sos", require("./Routes/api/SOS"));
app.use("/api/clo_plo_mapping", require("./Routes/api/clo_plo_mapping"));
app.use("/api/teacherCourseAssignment", require("./Routes/api/teacher_coursesAssignments"));
// app.use("/api/department", require("./Routes/api/department"));
// app.use("/api/program", require("./Routes/api/programs"));
// app.use("/api/plo", require("./Routes/api/plo"));
// app.use("/api/clo", require("./Routes/api/clo"));
// app.use("/api/assesment", require("./Routes/api/assesment"));
// app.use("/api/student", require("./Routes/api/student"));
// app.use("/api/teacher", require("./Routes/api/teacher"));
// app.use("/api/marks", require("./Routes/api/marks"));
// app.use("/api/clostatus", require("./Routes/api/cloStatus"));
// app.use("/api/plostatus", require("./Routes/api/ploStatus"));
app.listen(PORT, () => {
  console.log("Server is running on Port:", PORT);
});

const express = require('express');
const axios = require('axios'); 
const app = express();

const session = require('express-session');
const connectFlash = require('connect-flash'); 
const User = require('./models/user.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const userRouter = require('./router/user.js');

const Subject = require('./models/subject.js');
const Teacher = require('./models/teacher.js');

app.use(connectFlash());
const path = require('path');
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json());
app.use(express.urlencoded({extended:true}))

//const MongoStore = require('connect-mongo');
app.use(session({
  secret: 'your_secret_key', 
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to pass flash messages to all views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

const mongoose = require('mongoose');
main()
  .then(()=> console.log("connected to db"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/school");
}

app.use("/",userRouter);

// Route to show the add subject form
app.get('/addSubject', (req, res) => {
  res.render('subjectForm.ejs');
});

// Route to handle adding a subject
app.post('/addSubject', async (req, res) => {
  const { name, creditHours, isLab } = req.body;
  try {
      const newSubject = new Subject({
          name,
          creditHours,
          isLab: isLab === 'on'  // checkbox returns 'on' if checked
      });
      await Subject.register(newSubject);
      res.send('Subject added successfully!');
  } catch (err) {
      res.send('Error adding subject');
  }
});

// Route to show the add teacher form
app.get('/addTeacher', (req, res) => {
  res.render('teacherForm.ejs');
});


app.post('/addTeacher', async (req, res) => {
  const { name, subjects } = req.body;
  const subjectList = subjects.split(',').map(subject => subject.trim());
  try {
      const newTeacher = new Teacher({
          teacher: name,  // Correct field name from your schema
          subject: subjectList // Ensure alignment with your schema
      });
      await newTeacher.save(); // Use `save` method to save the document
      res.send('Teacher added successfully!');
  } catch (err) {
      console.error(err); // Log the error for debugging
      res.send('Error adding teacher');
  }
});

// Route to get all subjects
app.get('/getSubjects', async (req, res) => {
  try {
      const subjects = await Subject.find(); // Fetch all subjects
      res.json(subjects);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching subjects');
  }
});

// Route to get all teachers
app.get('/getTeachers', async (req, res) => {
  try {
      const teachers = await Teacher.find(); // Fetch all teachers
      res.json(teachers);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching teachers');
  }
});




async function fetchTimetableData() {
  try {
      const response = await axios.get('http://localhost:5000/timetable');
      return response.data;
  } catch (error) {
      console.error('Error fetching timetable data:', error.message);
      return {}; // Return empty data or mock data for development
  }
}


// Route to render the main timetable page
app.get('/', async (req, res) => {
  try {
    const sectionTimetables = await fetchTimetableData();
    res.render('server.ejs', { sectionTimetables: sectionTimetables });
    //res.send(JSON.stringify(sectionTimetables) );
  } catch (err) {
    res.status(500).send('Error generating timetable');
  }
});

/// Route to render the teacher timetable page
app.get('/teacher', async (req, res) => {
  try {
    const sectionTimetables = await fetchTimetableData();

    // Create an object to store teacher timetables
    const teacherTimetables = {};

    // Generate teacher timetables from sectionTimetables
    Object.keys(sectionTimetables).forEach(section => {
      const days = sectionTimetables[section];
      Object.keys(days).forEach(day => {
        const slots = days[day];
        slots.forEach(slot => {
          if (slot.teacher) {
            // Ensure teacher entry exists
            if (!teacherTimetables[slot.teacher]) {
              teacherTimetables[slot.teacher] = {};
            }

            // Ensure day entry exists for the teacher
            if (!teacherTimetables[slot.teacher][day]) {
              teacherTimetables[slot.teacher][day] = [];
            }

            // Add slot to teacher's timetable
            teacherTimetables[slot.teacher][day].push({
              time: slot.time,
              subject: slot.subject,
              section: section
            });
          }
        });
      });
    });


    // Pass the same data for sectionTimetables to the teacher timetable view
    res.render('teacher.ejs', { 
      sectionTimetables: JSON.stringify(sectionTimetables),
      teacherTimetables: JSON.stringify(teacherTimetables),
  });
  } catch (err) {
    res.status(500).send('Error generating teacher timetable');
  }
});


app.listen(8080,(req,res)=>{
    console.log("server is running");
})

//AXIOS for making HTTP requests between the express app and flask api 


// const Timetable = require("./models/timetable");
// const {router:timetableRoutes, generateTimetable } = require('./router/timetable');
// app.use("/timetable", timetableRoutes);



// let t1 = new Timetable({
//     day: "Monday",
//     startTime: "9:00",
//     endTime: "10:00",
//     teacher: "Mr. Smith",
//     subject: "Mathematics",
//     classroom: "Room 101"
// });

// t1.save()
// .then(() => console.log("Timetable saved successfully"))
// .catch((err)=>console.log(err));

// app.get('/',(req,res)=>{
//     res.render("index.ejs");
// })

// app.get('/', (req, res) => {
//   try {
//       const { sectionTimetables } = generateTimetable();
//       //console.log("Generated Timetables:" , sectionTimetables);
//       //console.log(JSON.stringify(sectionTimetables));
//       res.render('server.ejs', { sectionTimetables : JSON.stringify(sectionTimetables)}); // Pass data to index.ejs
//   } catch (err) {
//       console.error("Error generating timetable:", err);
//       res.status(500).send("Error generating timetable");
//   }
// });

// Teacher Timetable Route
// app.get('/teacher', (req, res) => {
//   try {
//       const { teacherTimetables } = generateTimetable();
//       res.render("teacher.ejs", { teacherTimetables });
//   } catch (err) {
//       console.error("Error generating teacher timetables:", err);
//       res.status(500).send("Internal Server Error");
//   }
// });

// app.get('/debug',(req,res)=>{
//   const sectionTimetables = generateTimetable();
//   res.json(sectionTimetables);
// })

// app.get('/teacher',(req,res)=>{
//   try {
//     const { teacherTimetable } = generateTimetable();
//     res.render("teacher.ejs", { teacherTimetable });
//   } catch (err) {
//     console.error("Error generating timetable:", err);
//     res.status(500).send("Internal Server Error");
//   }
// })
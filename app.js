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

//for the login and signup page
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
      await newSubject.save();
      res.redirect('/addSubject');
  } catch (err) {
    res.send('Error adding teacher');
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
          teacher: name,  
          subject: subjectList 
      });
      await newTeacher.save(); 
      res.redirect('/addTeacher');
  } catch (err) {
      console.error(err); 
      res.send('Error adding teacher');
  }
});

// Route to get all subjects
app.get('/getSubjects', async (req, res) => {
  try {
      const subjects = await Subject.find(); 
      res.json(subjects);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching subjects');
  }
});

// Route to get all teachers
app.get('/getTeachers', async (req, res) => {
  try {
      const teachers = await Teacher.find();
      res.json(teachers);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching teachers');
  }
});

app.get('/subjectList', async (req, res) => {
  try {
      const subjects = await Subject.find(); 
      res.render('subjectList.ejs', { subjects });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching subjects');
  }
});
app.get('/teacherList', async (req, res) => {
  try {
      const teachers = await Teacher.find();
      res.render('teacherList.ejs', { teachers });
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

app.listen(8080,(req,res)=>{
    console.log("server is running");
})

//AXIOS for making HTTP requests between the express app and flask api 

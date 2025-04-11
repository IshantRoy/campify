// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/campify')
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  rollNumber: String,
  age: Number,
  gender: String,
  address: String,
  fatherName: String,
  motherName: String,
  bloodGroup: String,
  attendance: [
    {
      subject: String,
      totalClasses: Number,
      attendedClasses: Number
    }
  ],
  timetable: {
    monday: [String],
    tuesday: [String],
    wednesday: [String],
    thursday: [String],
    friday: [String],
    saturday: [String],
    sunday: [String]
  },
  exams: [
    {
      subject: String,
      date: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    res.redirect(`/dashboard?username=${encodeURIComponent(user.username)}`);
  } else {
    res.send(`<h2 style="color: red; text-align: center;">Invalid credentials. Please try again.</h2>`);
  }
});

app.get('/dashboard', async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });

  if (!user) return res.send(`<h2>User not found</h2>`);

  res.send(`
    <html>
    <head>
      <title>Dashboard - Campify</title>
      <style>
        body { font-family: Arial; background-color: #f0f8ff; text-align: center; padding-top: 50px; }
        h1 { color: #2c3e50; }
        .card {
          display: block; width: 250px; margin: 20px auto; padding: 15px;
          background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          text-decoration: none; color: #2c3e50; font-weight: bold; transition: transform 0.2s;
        }
        .card:hover { transform: scale(1.05); background-color: #e0f7fa; }
      </style>
    </head>
    <body>
      <h1>Welcome, ${user.fullName}</h1>
      <a href="/academics?username=${user.username}" class="card">1. 📚 Academics</a>
      <div class="card">2. 🚧 Coming Soon</div>
      <div class="card">3. 🚧 Coming Soon</div>
      <a href="/profile?username=${user.username}" class="card">4. 👤 Profile</a>
    </body>
    </html>
  `);
});

app.get('/academics', (req, res) => {
  const username = req.query.username;
  res.send(`
    <html>
    <head>
      <title>Academics - Campify</title>
      <style>
        body { font-family: Arial; background-color: #fff8dc; text-align: center; padding-top: 50px; }
        h1 { color: #2c3e50; }
        .option {
          display: block; width: 200px; margin: 20px auto; padding: 15px;
          background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          font-weight: bold; text-decoration: none; color: #2c3e50; transition: background-color 0.3s ease;
        }
        .option:hover { background-color: #e0f7fa; }
      </style>
    </head>
    <body>
      <h1>📚 Academics</h1>
      <a class="option" href="/attendance?username=${username}">1. Attendance</a>
      <a class="option" href="/classes?username=${username}">2. Classes</a>
      <a class="option" href="/exams?username=${username}">3. Exam</a>
      <div class="option">4. Other</div>
      <br><br>
      <a href="/dashboard?username=${username}" class="option" style="width: 100px;">⬅ Back</a>
    </body>
    </html>
  `);
});

app.get('/attendance', async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username });
  if (!user) return res.send(`<h2>User not found</h2>`);

  const attendanceHTML = user.attendance.map(sub => {
    const percent = ((sub.attendedClasses / sub.totalClasses) * 100).toFixed(2);
    return `<tr><td>${sub.subject}</td><td>${sub.attendedClasses}/${sub.totalClasses}</td><td>${percent}%</td></tr>`;
  }).join('');

  const overall = (user.attendance.reduce((acc, cur) => acc + cur.attendedClasses, 0) /
                  user.attendance.reduce((acc, cur) => acc + cur.totalClasses, 0) * 100).toFixed(2);

  res.send(`
    <h1 style="text-align:center">📊 Attendance</h1>
    <table border="1" style="margin:auto; padding:20px; font-family: Arial">
      <tr><th>Subject</th><th>Classes Attended</th><th>Attendance %</th></tr>
      ${attendanceHTML}
    </table>
    <h3 style="text-align:center">Overall Attendance: ${overall}%</h3>
    <p style="text-align:center"><a href="/academics?username=${username}">⬅ Back</a></p>
  `);
});

app.get('/dashboard', async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });

  if (!user) return res.send(`<h2>User not found</h2>`);

  // Store full name in localStorage via client-side script
  res.send(`
    <script>
      localStorage.setItem('fullName', ${JSON.stringify(user.fullName)});
      window.location.href = "/dashboard.html?username=${username}";
    </script>
  `);
});

app.get('/academics', (req, res) => {
  const { username } = req.query;
  res.redirect(`/academics.html?username=${username}`);
});


app.get('/classes', async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username });
  if (!user) return res.send(`<h2>User not found</h2>`);

  const days = Object.entries(user.timetable).map(([day, classes]) => {
    return `<tr><td>${day.charAt(0).toUpperCase() + day.slice(1)}</td><td>${classes.join(', ')}</td></tr>`;
  }).join('');

  res.send(`
    <h1 style="text-align:center">🗓 Weekly Timetable</h1>
    <table border="1" style="margin:auto; padding:20px; font-family: Arial">
      <tr><th>Day</th><th>Classes</th></tr>
      ${days}
    </table>
    <p style="text-align:center"><a href="/academics?username=${username}">⬅ Back</a></p>
  `);
});

app.get('/exams', async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username });
  if (!user) return res.send(`<h2>User not found</h2>`);

  const examsHTML = user.exams.map(exam => {
    return `<tr><td>${exam.subject}</td><td>${exam.date}</td></tr>`;
  }).join('');

  res.send(`
    <h1 style="text-align:center">📝 Exam Schedule</h1>
    <table border="1" style="margin:auto; padding:20px; font-family: Arial">
      <tr><th>Subject</th><th>Date</th></tr>
      ${examsHTML}
    </table>
    <p style="text-align:center"><a href="/academics?username=${username}">⬅ Back</a></p>
  `);
});

app.get('/profile', async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username });

  if (!user) return res.send(`<h2>User not found</h2>`);

  res.send(`
    <h1 style="font-family: Arial; color: #2c3e50; text-align: center; margin-top: 40px;">
      ${user.fullName}'s Profile
    </h1>
    <div style="font-family: Arial; margin: auto; width: 50%; background: #ecf0f1; padding: 20px; border-radius: 12px;">
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Roll Number:</strong> ${user.rollNumber}</p>
      <p><strong>Age:</strong> ${user.age}</p>
      <p><strong>Gender:</strong> ${user.gender}</p>
      <p><strong>Blood Group:</strong> ${user.bloodGroup}</p>
      <p><strong>Address:</strong> ${user.address}</p>
      <p><strong>Father Name:</strong> ${user.fatherName}</p>
      <p><strong>Mother Name:</strong> ${user.motherName}</p>
    </div>
  `);
});

// Start Server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

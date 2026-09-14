const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",          // your MySQL username
  password: "root", // your MySQL password
  database: "evfinder"  // the DB containing 'stations' table
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// GET distinct cities
app.get("/api/cities", (req, res) => {
  db.query("SELECT DISTINCT city FROM stations", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET stations by city
app.get("/api/stations", (req, res) => {
  const city = req.query.city;
  db.query("SELECT id, station_name FROM stations WHERE city = ?", [city], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
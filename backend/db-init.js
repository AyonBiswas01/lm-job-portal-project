// Run once: node db-init.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./jobs.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    resume_text TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    candidate_id INTEGER,
    job_id INTEGER,
    score REAL,
    matching_skills TEXT,
    missing_skills TEXT,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Optional: seed some jobs (we'll insert a few sample jobs)
  const stmt = db.prepare("INSERT INTO jobs (title, company, location, description) VALUES (?, ?, ?, ?)");
  stmt.run('Frontend Developer', 'Acme Inc', 'Remote', 'We need a React developer with HTML/CSS/JavaScript experience and knowledge of REST APIs.');
  stmt.run('Data Scientist', 'DataLabs', 'Bengaluru', 'Looking for experience in Python, pandas, scikit-learn, ML, and SQL.');
  stmt.run('DevOps Engineer', 'CloudOps', 'Hyderabad', 'Kubernetes, Docker, CI/CD, AWS experience required.');
  stmt.finalize();

  console.log('DB initialized (jobs.db)');
  db.close();
});

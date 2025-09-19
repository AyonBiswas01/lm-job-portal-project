require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('./models');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const PORT = process.env.PORT || 4000;

// Endpoint: GET /api/jobs  -> list jobs with optional ?q=title
app.get('/api/jobs', (req, res) => {
  const q = req.query.q || '';
  const sql = q
    ? `SELECT * FROM jobs WHERE title LIKE ? OR company LIKE ? OR location LIKE ?` 
    : `SELECT * FROM jobs`;
  const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoint: POST /api/upload (multipart file) -> store resume text and return candidate id
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    const text = data.text || '';

    const { name, email } = req.body;
    db.run(`INSERT INTO candidates (name, email, resume_text) VALUES (?, ?, ?)`, [name || null, email || null, text], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ candidate_id: this.lastID, resume_text: text });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Helper: call LLM to extract skills from text (simple prompt to OpenAI)
async function extractSkillsFromText(text) {
  const prompt = `Extract a short comma-separated list of technical skills from the following text. Only output skills, no extra words. Text:\n\n${text}`;

  // Example using OpenAI's REST API via axios
  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    // fallback: very naive regex-based extraction
    const naive = (text.match(/\b(JavaScript|Java|Python|React|Node|SQL|Kubernetes|Docker|AWS|HTML|CSS|pandas|scikit-learn)\b/gi) || []).map(s => s.trim());
    return Array.from(new Set(naive)).slice(0, 40);
  }

  try {
    const r = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    }, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const skillsRaw = r.data.choices[0].message.content;
    const skills = skillsRaw.split(/[,\n]+/).map(s => s.replace(/[^a-zA-Z0-9.+#\- ]/g,'').trim()).filter(Boolean);
    return Array.from(new Set(skills)).slice(0, 60);
  } catch (e) {
    console.error('LLM error', e?.response?.data || e.message);
    return [];
  }
}

// Endpoint: POST /api/match -> { candidate_id, job_id }
// Returns score, matching_skills, missing_skills, explanation, stored in matches table
app.post('/api/match', async (req, res) => {
  try {
    const { candidate_id, job_id } = req.body;
    if (!candidate_id || !job_id) return res.status(400).json({ error: 'candidate_id and job_id required' });

    // fetch candidate and job
    db.get('SELECT * FROM candidates WHERE id = ?', [candidate_id], async (err, candidate) => {
      if (err || !candidate) return res.status(404).json({ error: 'Candidate not found' });
      db.get('SELECT * FROM jobs WHERE id = ?', [job_id], async (err2, job) => {
        if (err2 || !job) return res.status(404).json({ error: 'Job not found' });

        // extract skills
        const jobSkills = await extractSkillsFromText(job.description + ' ' + job.title + ' ' + job.company);
        const resumeSkills = await extractSkillsFromText(candidate.resume_text || '');

        // lower-case normalize
        const js = jobSkills.map(s => s.toLowerCase());
        const rs = resumeSkills.map(s => s.toLowerCase());
        const matching = rs.filter(s => js.includes(s));
        const missing = js.filter(s => !rs.includes(s));

        // Score: simple ratio (matching / job skills) * 100
        const score = js.length ? Math.round((matching.length / js.length) * 100) : 0;

        // Generate a short explanation via LLM (optional)
        let explanation = `Matched ${matching.length} of ${js.length} skills.`;
        const API_KEY = process.env.OPENAI_API_KEY;
        if (API_KEY) {
          try {
            const prompt = `Candidate resume skills: ${resumeSkills.join(', ')}\nJob required skills: ${jobSkills.join(', ')}\n\nProvide a concise 2-sentence explanation of why the candidate matches or doesn't match this job and list suggestions to improve the match.`;
            const r = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 200
            }, { headers: { Authorization: `Bearer ${API_KEY}` } });
            explanation = r.data.choices[0].message.content.trim();
          } catch (e) {
            console.error('explain error', e?.response?.data || e.message);
          }
        }

        // store match
        db.run(`INSERT INTO matches (candidate_id, job_id, score, matching_skills, missing_skills, explanation) VALUES (?, ?, ?, ?, ?, ?)`, [candidate_id, job_id, score, matching.join(','), missing.join(','), explanation], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ match_id: this.lastID, score, matching_skills: matching, missing_skills: missing, explanation });
        });
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Matching failed' });
  }
});

// Endpoint: GET /api/matches?candidate_id= -> list matches for candidate
app.get('/api/matches', (req, res) => {
  const candidate_id = req.query.candidate_id;
  const sql = candidate_id ? 'SELECT * FROM matches WHERE candidate_id = ?' : 'SELECT * FROM matches';
  const params = candidate_id ? [candidate_id] : [];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

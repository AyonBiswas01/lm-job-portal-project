import React, {useEffect, useState} from 'react'

export default function Results(){
  const [candidateId,setCandidateId] = useState('')
  const [jobs,setJobs] = useState([])
  const [matches,setMatches] = useState([])

  useEffect(()=>{ fetch('http://localhost:4000/api/jobs').then(r=>r.json()).then(setJobs) },[])

  async function runMatch(jobId){
    if(!candidateId) return alert('Enter candidate id after uploading')
    const res = await fetch('http://localhost:4000/api/match', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ candidate_id: Number(candidateId), job_id: jobId }) })
    const data = await res.json()
    alert('Match score: ' + data.score)
    // refresh matches list
    const m = await fetch(`http://localhost:4000/api/matches?candidate_id=${candidateId}`).then(r=>r.json())
    setMatches(m)
  }

  return (
    <div style={{padding:20}}>
      <h3>Run Matches / See Results</h3>
      <div>
        <input placeholder="Candidate ID (from upload)" value={candidateId} onChange={e=>setCandidateId(e.target.value)} />
      </div>

      <h4>Jobs</h4>
      <ul>
        {jobs.map(j=> (
          <li key={j.id} style={{border:'1px solid #ddd', margin:8, padding:8}}>
            <strong>{j.title}</strong> — {j.company}
            <div style={{marginTop:6}}>
              <button onClick={()=>runMatch(j.id)}>Run Match</button>
            </div>
          </li>
        ))}
      </ul>

      <h4>Matches</h4>
      <ul>
        {matches.map(m=> (
          <li key={m.id} style={{border:'1px solid #eee', margin:6, padding:8}}>
            Job ID: {m.job_id} — Score: {m.score}
            <div><strong>Matching:</strong> {m.matching_skills}</div>
            <div><strong>Missing:</strong> {m.missing_skills}</div>
            <div><strong>Explanation:</strong> <pre style={{whiteSpace:'pre-wrap'}}>{m.explanation}</pre></div>
          </li>
        ))}
      </ul>
    </div>
  )
}

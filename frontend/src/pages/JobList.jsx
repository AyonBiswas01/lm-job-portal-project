import React, {useEffect, useState} from 'react'

export default function JobList(){
  const [jobs,setJobs] = useState([])
  const [q,setQ] = useState('')

  useEffect(()=>{ fetchJobs() },[])
  async function fetchJobs(){
    const res = await fetch(`http://localhost:4000/api/jobs?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setJobs(data)
  }

  return (
    <div style={{padding:20}}>
      <div>
        <input placeholder="Search title/company/location" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={fetchJobs}>Search</button>
      </div>
      <ul>
        {jobs.map(j=> (
          <li key={j.id} style={{border:'1px solid #ddd', margin:8, padding:8}}>
            <strong>{j.title}</strong> — {j.company} ({j.location})
            <p>{j.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

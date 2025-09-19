import React from 'react'
import { Link } from 'react-router-dom'
export default function App(){
  return (
    <div style={{padding:20}}>
      <header style={{display:'flex', gap:20, marginBottom:20}}>
        <h2>LM-Powered Job Portal</h2>
        <nav>
          <Link to="/">Jobs</Link> | <Link to="/upload">Upload Resume</Link> | <Link to="/results">Results</Link>
        </nav>
      </header>
    </div>
  )
}

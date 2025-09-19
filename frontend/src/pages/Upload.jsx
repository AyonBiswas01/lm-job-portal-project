import React, {useState} from 'react'

export default function Upload(){
  const [file,setFile] = useState(null)
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [resumeText,setResumeText] = useState('')
  const [candidateId,setCandidateId] = useState(null)

  async function handleUpload(e){
    e.preventDefault()
    if(!file) return alert('Select PDF')
    const form = new FormData()
    form.append('resume', file)
    form.append('name', name)
    form.append('email', email)
    const res = await fetch('http://localhost:4000/api/upload', { method:'POST', body: form })
    const data = await res.json()
    if(data.candidate_id){
      setCandidateId(data.candidate_id)
      setResumeText(data.resume_text.slice(0,1000) + (data.resume_text.length>1000? '...':'') )
      alert('Uploaded — candidate id: ' + data.candidate_id)
    } else {
      alert('Upload failed')
    }
  }

  return (
    <div style={{padding:20}}>
      <h3>Upload Resume (PDF)</h3>
      <form onSubmit={handleUpload}>
        <div>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files[0])} />
        </div>
        <button type="submit">Upload</button>
      </form>

      {candidateId && (
        <div style={{marginTop:20}}>
          <h4>Extracted Resume Text (preview)</h4>
          <pre style={{maxHeight:300, overflow:'auto', background:'#f5f5f5', padding:10}}>{resumeText}</pre>
          <p>Candidate ID: {candidateId}</p>
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'

import KredilySdk from '../pages/api/kredily.sdk'
import './LoginForm.css'

function LoginForm(props) {
  const { inputError, onSubmit } = props

  const [domain, setDomain] = useState(KredilySdk.domain || 'refrens')
  const [uname, setUname] = useState(KredilySdk.uname || 'nitish@refrens.com')
  const [pass, setPass] = useState(KredilySdk.pass || '')

  const onFormSubmit = (e) => {
    e.preventDefault()
    onSubmit({ domain, uname, pass })
  }

  return (
    <div className="login">
      <h2 id="form-title">
        Login to <span className="app-name">Kredily</span>
      </h2>
      <form onSubmit={onFormSubmit}>
        <label for="domain-input">Domain</label>
        <input
          id="domain-input"
          type="text"
          placeholder="Domain (eg. 'refrens')"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        />

        <label for="uname-input">Email</label>
        <input
          id="uname-input"
          type="text"
          placeholder="Email"
          value={uname}
          onChange={(e) => setUname(e.target.value)}
          required
        />

        <label for="pass-input">Password</label>
        <input
          id="pass-input"
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />

        {inputError && (
          <p className="error">{inputError?.message || inputError}</p>
        )}

        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default LoginForm

import React, { useEffect, useState } from 'react'

import ClockDetails from '../../components/ClockDetails'
import LoginForm from '../../components/LoginForm'
import KredilySdk from '../api/kredily.sdk'
import './Popup.css'
import logo from '../../assets/img/logo.svg'

const Popup = () => {
  const [loading, setLoading] = useState(false)

  const [loggedIn, setLoggedIn] = useState(false)

  const [inputError, setInputError] = useState('')

  useEffect(() => {
    const { domain, uname, pass } = KredilySdk
    if (domain && uname && pass) {
      login({ domain, uname, pass, reconfigureSdk: false })
    }
  }, [])

  const login = async ({ domain, uname, pass, reconfigureSdk = true }) => {
    setLoading(true)
    if (inputError) {
      setInputError('')
    }
    if (reconfigureSdk) {
      KredilySdk.configureSdk(domain)
    }
    try {
      await KredilySdk.login(uname, pass)

      setLoggedIn(true)
    } catch (err) {
      console.log(err)
      setInputError(err)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    return loggedIn ? (
      <ClockDetails onLogout={() => setLoggedIn(false)} />
    ) : (
      <LoginForm onSubmit={login} inputError={inputError} />
    )
  }

  return (
    <div className="App">
      {loading ? (
        <header className="App-header">
          <img src={logo} className="loader" alt="loader" />
        </header>
      ) : (
        <section id="content">{renderContent()}</section>
      )}
    </div>
  )
}

export default Popup

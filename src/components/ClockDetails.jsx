import React, { useEffect, useMemo, useState } from 'react'
import { useStopwatch } from 'react-timer-hook'

import KredilySdk from '../pages/api/kredily.sdk'
import './ClockDetails.css'
import logo from '../assets/img/logo.svg'

const today = new Date()

const ClockDetails = (props) => {
  const { onLogout } = props

  const [loading, setLoading] = useState(false)
  const [attendanceLogs, setAttendanceLogs] = useState(false)
  const [punchCount, setPunchCount] = useState(0)

  const [error, setError] = useState('')

  const {
    seconds,
    minutes,
    hours,
    isRunning: stopwatchRunning,
    start: startStopwatch,
    pause: pauseStopwatch,
    reset: resetStopwatch,
  } = useStopwatch({ autoStart: false, offsetTimestamp: 0 })

  const { employeeData = {} } = KredilySdk
  const {
    employee_uu: empId,
    employee_first_name: fname,
    employee_last_name: lname,
    work_duration: workDuration,
    break_duration: breakDuration,
  } = employeeData

  useEffect(() => {
    getAttendanceLogs()
  }, [])

  const clearErrors = () => {
    if (error) {
      setError('')
    }
  }

  const getAttendanceLogs = async () => {
    if (!loading) {
      setLoading(true)
    }
    try {
      const logs = await KredilySdk.fetchAttendanceLogs()
      setAttendanceLogs(logs?.attendance_log || [])
      setPunchCount(logs?.prev_punch_count || 0)
      clearErrors()
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const clockIn = async () => {
    setLoading(true)
    try {
      await KredilySdk.clockIn(punchCount)
      getAttendanceLogs()
      clearErrors()
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const clockOut = async (uu) => {
    setLoading(true)
    try {
      await KredilySdk.clockOut(uu, punchCount)
      getAttendanceLogs()
      clearErrors()
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    await KredilySdk.logout()
    onLogout()
  }

  const clockConfig = useMemo(() => {
    if (!attendanceLogs?.length) {
      return null
    }
    const recentLog = attendanceLogs[0]

    const config = {
      clockInTime: recentLog.emp_time_in
        ? new Date(recentLog.emp_time_in)
        : undefined,
      clockOutTime: recentLog.emp_time_out
        ? new Date(recentLog.emp_time_out)
        : undefined,
      lastClockIn: recentLog.last_punch_in
        ? new Date(recentLog.last_punch_in)
        : undefined,
      uu: recentLog.uu,
    }
    console.log(config, 'config')

    // configure stopwatch timer
    let offsetTimestamp = undefined
    if (config.clockInTime && config.lastClockIn && !config.clockOutTime) {
      const now = new Date()
      const diff = now - config.lastClockIn
      const diffSec = Math.floor(diff / 1000)
      console.log(diffSec, 'diffSec')
      now.setSeconds(now.getSeconds() + diffSec)
      offsetTimestamp = now
      console.log(offsetTimestamp, 'offsetTimestamp')
    }
    resetStopwatch(offsetTimestamp, !!config.clockInTime)

    return config
  }, [attendanceLogs])

  const formatStopwatchTime = (num) => {
    return num.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false,
    })
  }

  const getStopwatchTime = () => {
    return stopwatchRunning
      ? `${formatStopwatchTime(hours)}:${formatStopwatchTime(
          minutes
        )}:${formatStopwatchTime(seconds)}`
      : '--:--:--'
  }

  return loading ? (
    <div className="loader-container">
      <img src={logo} className="loader" alt="loader" />
    </div>
  ) : empId ? (
    <div>
      <header>
        <button id="logout-btn" onClick={logout}>
          Logout
        </button>
        <h3>
          Hello, <em>{`${fname} ${lname}`}</em>!
        </h3>
      </header>
      <div className="clock-btn-container">
        {!clockConfig ||
        !clockConfig.clockInTime ||
        (!!clockConfig.clockInTime && !!clockConfig.clockOutTime) ? (
          <button
            className="clock-btn clock-in"
            onClick={clockIn}
            disabled={loading}
          >
            Clock In
          </button>
        ) : (
          <>
            <button
              className="clock-btn clock-out"
              onClick={() => clockOut(clockConfig.uu)}
              disabled={loading}
            >
              Clock Out
            </button>
            <p>
              <strong>Duration: </strong>
              <em>{getStopwatchTime()}</em>
            </p>
          </>
        )}
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <p>
          <strong>Date: </strong>
          <em>{today.toLocaleDateString('en-GB')}</em>
        </p>
        <p>
          <strong>Logged Work Duration: </strong>
          <em>{workDuration}</em>
        </p>
        <p>
          <strong>Logged Break Duration: </strong>
          <em>{breakDuration}</em>
        </p>
        {error && <p className="error">Error: {error?.message || error}</p>}
      </div>
    </div>
  ) : (
    <div>Please Log In</div>
  )
}

export default ClockDetails

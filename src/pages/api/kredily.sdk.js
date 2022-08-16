import axios from 'axios'

class Kredily {
  constructor() {
    this.employeeData = null

    chrome.storage.local.get(['uname', 'domain', 'pass'], (result) => {
      this.configureSdk(result.domain, result.uname, result.pass)
      console.info('Hydrated user auth')
    })
  }

  configureSdk = (domain = '', uname = '', pass = '') => {
    this.domain = domain
    this.uname = uname
    this.pass = pass

    this.baseUrl = domain
      ? `https://${domain}.kredily.com`
      : 'https://kredily.com'

    this.configureApi()

    this.isSdkConfigured = true
  }

  performConfigCheck = () => {
    if (!this.isSdkConfigured) {
      throw new Error('Kredily SDK not configured')
    }
  }

  configureApi = () => {
    if (!this.baseUrl) {
      throw new Error('Kredily SDK not configured')
    }

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
    })
  }

  async login(email, password) {
    this.performConfigCheck()

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const res = await this.api.post('/login/', {
      email,
      password,
      otp: '',
      first_login: '0',
      prospect_id: '',
      key: '',
      otp_login: '0',
      next: '',
    })

    if (!res || !res?.status === 200) {
      throw new Error('Login failed')
    }

    const { data: loginData = {} } = res
    if (loginData.message?.status === 'error') {
      throw new Error(loginData.message.validation || 'Login failed')
    }
    if (loginData.message?.status !== 'logged_in') {
      throw new Error('Login failed')
    }

    this.uname = email
    this.pass = password

    this.api.defaults.withCredentials = true
    // this.api.defaults.headers.post['X-CSRF-Token'] = document.cookie
    //   .split('; ')
    //   .find((row) => row.startsWith('csrftoken='))
    //   ?.split('=')[1]

    try {
      const csrftoken = await this._getCookie('csrftoken')
      this.api.defaults.headers.post['X-CSRF-Token'] = csrftoken
    } catch (err) {
      console.error(err)
      // noop
    }

    await this.checkLogin()

    return true
  }

  checkLogin = async () => {
    // successful login sets http only cookies
    // so we perform a request to get the employee data with the cookies that were set
    const today = new Date()
    // will return a 200 with the employee data if cookies are valid
    const employeeRes = await this.api.get(
      `/attendanceLog/view_selected_employee_daily_attendance_log/?date=${today.toLocaleDateString(
        'en-GB'
      )}&{}`
    )
    if (!employeeRes || !employeeRes?.status === 200 || !employeeRes?.data) {
      throw new Error('Login failed; Incorrect credentials')
    }
    const { data = {} } = employeeRes
    if (!data.employee_uu) {
      throw new Error('Login failed; Failed to get employee data')
    }
    this.employeeData = data

    chrome.storage.local.set(
      { domain: this.domain, uname: this.uname, pass: this.pass },
      function () {
        console.info('Saved auth data to browser storage')
      }
    )
  }

  async logout() {
    this.performConfigCheck()

    try {
      await this.api.get('/accounts/logout/')
    } catch (error) {
      // noop
    }

    this.configureSdk()

    chrome.storage.local.set({ domain: '', uname: '', pass: '' }, function () {
      console.info('Reset auth data of browser storage')
    })

    return true
  }

  clockIn = async (prevPunchCount = 0) => {
    const res = await this.api.post('/attendanceLog/clockIn/', {
      prev_punch_count: prevPunchCount,
    })
    if (!res || !res?.status === 201 || !res?.data) {
      throw new Error('Could not clock in')
    }

    return res?.data
  }

  clockOut = async (uu, prevPunchCount = '1') => {
    const res = await this.api.put('/attendanceLog/clockOut/', {
      prev_punch_count: prevPunchCount,
      uu,
    })
    if (!res || !res?.status === 201 || !res?.data) {
      throw new Error('Could not clock out')
    }

    return res?.data
  }

  fetchAttendanceLogs = async () => {
    const res = await this.api.get('/attendanceLog/clockingWidgetApi/')
    if (!res || !res?.status === 200 || !res?.data) {
      throw new Error('Could not get attendance log')
    }
    this.attendanceLog = res.data

    this._getCookie('csrftoken')

    return this.attendanceLog
  }

  _getCookie = (name) => {
    return new Promise((resolve, reject) => {
      chrome.cookies.getAll(
        {
          //domain: 'refrens.kredily.com',
          //name: name,
        },
        (cookie) => {
          if (cookie) {
            console.log(cookie, '!!!!!!!!!!cookie!!!!!!!!!!!!!')
            // console.log(cookie.value, 'cookie!')
            resolve(cookie)
          } else {
            console.info("Can't get cookie! Check the name!")
            reject(0)
          }
        }
      )
    })
  }
}

const KredilySdk = new Kredily()

export default KredilySdk

const express = require('express')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
const methodOverride = require('method-override')
require('dotenv').config()

const app = express()

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

// Session
app.set('trust proxy', 1)

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'catat-uang-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,      // true hanya jika HTTPS langsung
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 hari
    },
  })
)

app.use(flash())

// Global variables untuk EJS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

// View Engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Routes
app.use('/', require('./routes/auth'))
app.use('/dashboard', require('./routes/dashboard'))
app.use('/categories', require('./routes/categories'))
app.use('/transactions', require('./routes/transactions'))
app.use('/reports', require('./routes/reports'))

// Home redirect
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard')
  }
  res.redirect('/login')
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
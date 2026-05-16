const supabase = require('../config/supabase')

exports.showLogin = (req, res) => {
  res.render('auth/login')
}

exports.showRegister = (req, res) => {
  res.render('auth/register')
}

exports.register = async (req, res) => {
  const { full_name, email, password } = req.body

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  })

  if (error) {
    req.flash('error', error.message)
    return res.redirect('/register')
  }

  req.flash('success', 'Registrasi berhasil. Silakan login.')
  res.redirect('/login')
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    req.flash('error', error.message)
    return res.redirect('/login')
  }

  req.session.user = {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  }

  req.session.save(() => {
    res.redirect('/dashboard')
  })
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login')
  })
}
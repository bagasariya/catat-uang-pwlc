const supabase = require('../config/supabase')

// ================= LOGIN =================
exports.showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: null,
  })
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      return res.render('auth/login', {
        title: 'Login',
        error: error.message,
      })
    }

    // Simpan session user
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
    }
    console.log('Session user:', req.session.user)
    // Pastikan session benar-benar tersimpan
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err)
        return res.render('auth/login', {
          title: 'Login',
          error: 'Gagal menyimpan session.',
        })
      }

      res.redirect('/dashboard')
    })
  } catch (err) {
    console.error('Login error:', err)

    res.render('auth/login', {
      title: 'Login',
      error: 'Terjadi kesalahan saat login.',
    })
  }
}

// ================= REGISTER =================
exports.showRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    error: null,
  })
}

exports.register = async (req, res) => {
  try {
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
      return res.render('auth/register', {
        title: 'Register',
        error: error.message,
      })
    }

    res.redirect('/login')
  } catch (err) {
    console.error('Register error:', err)

    res.render('auth/register', {
      title: 'Register',
      error: 'Terjadi kesalahan saat registrasi.',
    })
  }
}

// ================= LOGOUT =================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login')
  })
}
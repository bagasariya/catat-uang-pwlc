module.exports = (req, res, next) => {
  // Jika session user belum ada, arahkan ke login
  if (!req.session || !req.session.user) {
    return res.redirect('/login')
  }
  // console.log('Middleware session:', req.session.user)
  // Lanjut ke route berikutnya
  next()
}
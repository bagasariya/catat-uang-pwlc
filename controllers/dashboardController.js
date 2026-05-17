const supabase = require('../config/supabase')

exports.index = async (req, res) => {
  try {
    const userId = req.session.user.id

    // Ambil semua transaksi + kategori
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories(name, type)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })

    if (error) {
      return res.send(`Error: ${error.message}`)
    }

    const allTransactions = data || []

// ==========================================
// Default filter = bulan & tahun saat ini
// ==========================================
const now = new Date()
const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
const currentYear = String(now.getFullYear())

// Jika query tidak ada, gunakan bulan dan tahun sekarang
// Jika query kosong (''), berarti user memilih "Semua"
const month = req.query.month ?? currentMonth
const year = req.query.year ?? currentYear

// Filter transaksi sesuai periode
let transactions = allTransactions

if (month || year) {
  transactions = allTransactions.filter((item) => {
    const date = new Date(item.transaction_date)
    const itemMonth = String(date.getMonth() + 1).padStart(2, '0')
    const itemYear = String(date.getFullYear())

    const matchMonth = month ? itemMonth === month : true
    const matchYear = year ? itemYear === year : true

    return matchMonth && matchYear
  })
}

    let totalIncome = 0
    let totalExpense = 0

    const incomeMap = {}
    const expenseMap = {}

    // Hitung total
    transactions.forEach((item) => {
      const amount = Number(item.amount)
      const categoryName = item.categories?.name || 'Tanpa Kategori'
      const type = item.categories?.type

      if (type === 'income') {
        totalIncome += amount
        incomeMap[categoryName] =
          (incomeMap[categoryName] || 0) + amount
      }

      if (type === 'expense') {
        totalExpense += amount
        expenseMap[categoryName] =
          (expenseMap[categoryName] || 0) + amount
      }
    })

    const balance = totalIncome - totalExpense
    const totalTransactions = transactions.length

    // Konversi object menjadi array
    const incomeByCategory = Object.entries(incomeMap).map(
      ([name, total]) => ({ name, total })
    )

    const expenseByCategory = Object.entries(expenseMap).map(
      ([name, total]) => ({ name, total })
    )

    // Ambil 5 transaksi terbaru
    const recentTransactions = transactions.slice(0, 5)

    res.render('dashboard/index', {
  title: 'Dashboard',
  user: req.session.user,

  totalIncome,
  totalExpense,
  balance,
  totalTransactions,

  incomeByCategory,
  expenseByCategory,
  recentTransactions,

  // Filter aktif
  month,
  year,
  currentMonth,
  currentYear,
})
  } catch (err) {
    res.send(`Error: ${err.message}`)
  }
}
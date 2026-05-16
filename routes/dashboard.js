const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const supabase = require('../config/supabase')

router.get('/', auth, async (req, res) => {
  const userId = req.session.user.id

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      amount,
      categories(type)
    `)
    .eq('user_id', userId)

  let totalIncome = 0
  let totalExpense = 0

  ;(transactions || []).forEach((item) => {
    const amount = Number(item.amount)
    const type = item.categories?.type

    if (type === 'income') {
      totalIncome += amount
    } else if (type === 'expense') {
      totalExpense += amount
    }
  })

  const balance = totalIncome - totalExpense
  const totalTransactions = (transactions || []).length

  res.render('dashboard/index', {
    title: 'Dashboard',
    totalIncome,
    totalExpense,
    balance,
    totalTransactions,
  })
})

module.exports = router
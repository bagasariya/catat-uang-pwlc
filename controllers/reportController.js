const supabase = require('../config/supabase')
const PDFDocument = require('pdfkit')

function calculateTotals(transactions) {
  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((item) => {
    const amount = Number(item.amount)
    const type = item.categories?.type

    if (type === 'income') totalIncome += amount
    if (type === 'expense') totalExpense += amount
  })

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  }
}

exports.index = async (req, res) => {
  const userId = req.session.user.id
  const { start_date, end_date } = req.query

  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories(name, type)
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })

  if (start_date) {
    query = query.gte('transaction_date', start_date)
  }

  if (end_date) {
    query = query.lte('transaction_date', end_date)
  }

  const { data } = await query
  const transactions = data || []

  const totals = calculateTotals(transactions)

  res.render('reports/index', {
    title: 'Laporan',
    transactions,
    start_date,
    end_date,
    ...totals,
  })
}

exports.exportPdf = async (req, res) => {
  const userId = req.session.user.id
  const { start_date, end_date } = req.query

  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories(name, type)
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })

  if (start_date) {
    query = query.gte('transaction_date', start_date)
  }

  if (end_date) {
    query = query.lte('transaction_date', end_date)
  }

  const { data } = await query
  const transactions = data || []

  const { totalIncome, totalExpense, balance } =
    calculateTotals(transactions)

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=\"laporan-keuangan.pdf\"'
  )
  res.setHeader('Content-Type', 'application/pdf')

  const doc = new PDFDocument({ margin: 50 })
  doc.pipe(res)

  doc.fontSize(20).text('Laporan Keuangan', { align: 'center' })
  doc.moveDown()

  doc.fontSize(12)
  doc.text(`Total Pemasukan : Rp ${totalIncome.toLocaleString('id-ID')}`)
  doc.text(`Total Pengeluaran : Rp ${totalExpense.toLocaleString('id-ID')}`)
  doc.text(`Saldo : Rp ${balance.toLocaleString('id-ID')}`)
  doc.moveDown()

  transactions.forEach((item, index) => {
    doc.text(
      `${index + 1}. ${item.transaction_date} | ` +
      `${item.categories?.name || '-'} | ` +
      `Rp ${Number(item.amount).toLocaleString('id-ID')} | ` +
      `${item.description || '-'}`
    )
  })

  doc.end()
}
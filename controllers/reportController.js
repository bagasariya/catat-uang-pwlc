const supabase = require('../config/supabase')

exports.index = async (req, res) => {
  try {
    const userId = req.session.user.id

    // Deteksi apakah user sudah menekan tombol Tampilkan
    // /reports                -> false
    // /reports?month=05&year=2026 -> true
    // /reports?month=&year=      -> true
    const hasFilter =
      req.query.month !== undefined ||
      req.query.year !== undefined

    const showReport = hasFilter

    // Daftar tahun untuk dropdown
    const currentYear = new Date().getFullYear()
    const years = []

    for (let y = currentYear; y >= currentYear - 10; y--) {
      years.push(y)
    }

    // Nilai default dropdown (kosong)
    const month = req.query.month || ''
    const year = req.query.year || ''

    // Jika belum memilih filter, hanya tampilkan form
    if (!showReport) {
      return res.render('reports/index', {
        title: 'Laporan',
        showReport: false,
        month,
        year,
        years,
      })
    }

    // Ambil semua transaksi user
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

    let transactions = data || []

    // Filter bulan dan tahun
    if (month || year) {
      transactions = transactions.filter((item) => {
        const date = new Date(item.transaction_date)
        const itemMonth = String(date.getMonth() + 1).padStart(2, '0')
        const itemYear = String(date.getFullYear())

        const matchMonth = month ? itemMonth === month : true
        const matchYear = year ? itemYear === year : true

        return matchMonth && matchYear
      })
    }

    // Hitung ringkasan
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach((item) => {
      const amount = Number(item.amount)

      if (item.categories?.type === 'income') {
        totalIncome += amount
      }

      if (item.categories?.type === 'expense') {
        totalExpense += amount
      }
    })

    const balance = totalIncome - totalExpense
    const totalData = transactions.length

    // Render laporan
    res.render('reports/index', {
      title: 'Laporan',
      showReport: true,

      month,
      year,
      years,

      transactions,
      totalIncome,
      totalExpense,
      balance,
      totalData,
    })
  } catch (err) {
    res.send(`Error: ${err.message}`)
  }
}

const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')

/**
 * Helper: ambil data laporan sesuai filter month & year
 */
async function getReportData(userId, month = '', year = '') {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories(name, type)
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  let transactions = data || []

  // Filter bulan dan tahun
  if (month || year) {
    transactions = transactions.filter((item) => {
      const date = new Date(item.transaction_date)
      const itemMonth = String(date.getMonth() + 1).padStart(2, '0')
      const itemYear = String(date.getFullYear())

      const matchMonth = month ? itemMonth === month : true
      const matchYear = year ? itemYear === year : true

      return matchMonth && matchYear
    })
  }

  // Hitung ringkasan
  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((item) => {
    const amount = Number(item.amount)

    if (item.categories?.type === 'income') {
      totalIncome += amount
    }

    if (item.categories?.type === 'expense') {
      totalExpense += amount
    }
  })

  return {
    transactions,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  }
}

/**
 * Export PDF
 */
exports.exportPdf = async (req, res) => {
  try {
    const userId = req.session.user.id
    const month = req.query.month || ''
    const year = req.query.year || ''

    const report = await getReportData(userId, month, year)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="laporan-keuangan.pdf"'
    )

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4'
    })

    doc.pipe(res)

    // Judul
    doc.fontSize(18).text('Laporan Keuangan', {
      align: 'center'
    })

    doc.moveDown()

    // Ringkasan
    doc.fontSize(12)
    doc.text(
      `Total Pemasukan: Rp ${report.totalIncome.toLocaleString('id-ID')}`
    )
    doc.text(
      `Total Pengeluaran: Rp ${report.totalExpense.toLocaleString('id-ID')}`
    )
    doc.text(
      `Saldo: Rp ${report.balance.toLocaleString('id-ID')}`
    )

    doc.moveDown()

    // Detail transaksi
    doc.fontSize(14).text('Detail Transaksi')
    doc.moveDown(0.5)

    if (report.transactions.length === 0) {
      doc.fontSize(11).text('Tidak ada data.')
    } else {
      report.transactions.forEach((item, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${item.transaction_date} | ` +
          `${item.categories?.name || '-'} | ` +
          `${item.description || '-'} | ` +
          `Rp ${Number(item.amount).toLocaleString('id-ID')}`
        )
      })
    }

    doc.end()
  } catch (err) {
    res.send(`Error: ${err.message}`)
  }
}

/**
 * Export Excel
 */
exports.exportExcel = async (req, res) => {
  try {
    const userId = req.session.user.id
    const month = req.query.month || ''
    const year = req.query.year || ''

    const report = await getReportData(userId, month, year)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan')

    // Judul
    worksheet.addRow(['Laporan Keuangan'])
    worksheet.addRow([])

    // Ringkasan
    worksheet.addRow([
      'Total Pemasukan',
      report.totalIncome
    ])
    worksheet.addRow([
      'Total Pengeluaran',
      report.totalExpense
    ])
    worksheet.addRow([
      'Saldo',
      report.balance
    ])

    worksheet.addRow([])
    worksheet.addRow([
      'Tanggal',
      'Kategori',
      'Jenis',
      'Deskripsi',
      'Nominal'
    ])

    // Data transaksi
    report.transactions.forEach((item) => {
      worksheet.addRow([
        item.transaction_date,
        item.categories?.name || '-',
        item.categories?.type === 'income'
          ? 'Pemasukan'
          : 'Pengeluaran',
        item.description || '-',
        Number(item.amount)
      ])
    })

    // Format nominal
    worksheet.getColumn(5).numFmt =
      '#,##0'

    // Header response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="laporan-keuangan.xlsx"'
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    res.send(`Error: ${err.message}`)
  }
}
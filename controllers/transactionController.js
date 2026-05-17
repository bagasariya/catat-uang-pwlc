const supabase = require('../config/supabase')

exports.index = async (req, res) => {
  try {
    const userId = req.session.user.id

    // Query string
    const search = (req.query.search || '').trim()

    // Default filter = bulan & tahun saat ini
    const now = new Date()
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
    const currentYear = String(now.getFullYear())

    // Jika query tidak ada → gunakan bulan & tahun sekarang
    // Jika query kosong ('') → berarti user memilih "Semua"
    const month = req.query.month ?? currentMonth
    const year = req.query.year ?? currentYear

    // Pagination
    const page = parseInt(req.query.page || '1', 10)
    const limit = 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    // ==========================================
    // Build range tanggal untuk filter
    // ==========================================
    let startDate = null
    let endDate = null

    if (year && month) {
      // Contoh: 2026-05-01 s/d 2026-05-31
      startDate = `${year}-${month}-01`

      const lastDay = new Date(
        Number(year),
        Number(month),
        0
      ).getDate()

      endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    } else if (year && !month) {
      // Semua bulan pada tahun tertentu
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
    } else if (!year && month) {
      // Semua tahun untuk bulan tertentu
      // Tidak dibatasi tanggal, difilter di aplikasi
    }

    // ==========================================
    // Query dasar
    // ==========================================
    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        categories(name, type)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)

    // Filter rentang tanggal
    if (startDate && endDate) {
      query = query
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
    }

    // Urutkan dan pagination
    query = query
      .order('transaction_date', { ascending: false })
      .range(from, to)

    const {
      data: transactions,
      error,
      count,
    } = await query

    if (error) {
      return res.send(`Error: ${error.message}`)
    }

    let filteredTransactions = transactions || []

    // Search (hanya pada data halaman aktif)
    if (search) {
      const keyword = search.toLowerCase()

      filteredTransactions = filteredTransactions.filter((item) => {
        const description = (item.description || '').toLowerCase()
        const categoryName = (item.categories?.name || '').toLowerCase()

        return (
          description.includes(keyword) ||
          categoryName.includes(keyword)
        )
      })
    }

    // Filter khusus "semua tahun untuk bulan tertentu"
    if (!year && month) {
      filteredTransactions = filteredTransactions.filter((item) => {
        const date = new Date(item.transaction_date)
        const itemMonth = String(date.getMonth() + 1).padStart(2, '0')
        return itemMonth === month
      })
    }

    // Statistik berdasarkan data yang tampil
    let totalIncome = 0
    let totalExpense = 0

    filteredTransactions.forEach((item) => {
      const amount = Number(item.amount)
      const type = item.categories?.type

      if (type === 'income') totalIncome += amount
      if (type === 'expense') totalExpense += amount
    })

    const balance = totalIncome - totalExpense

    // Total data & total halaman
    const totalData = count || 0
    const totalPages = Math.max(1, Math.ceil(totalData / limit))

    // Daftar tahun untuk dropdown
    const yearNumber = new Date().getFullYear()
    const years = []

    for (let y = yearNumber; y >= yearNumber - 10; y--) {
      years.push(y)
    }

    // Render view
    res.render('transactions/index', {
      title: 'Transaksi',
      transactions: filteredTransactions,

      // Filter
      search,
      month,
      year,
      years,
      currentMonth,
      currentYear,

      // Pagination
      currentPage: page,
      totalPages,

      // Statistik
      totalIncome,
      totalExpense,
      balance,
      totalData,
    })
  } catch (err) {
    res.send(`Error: ${err.message}`)
  }
}

exports.create = async (req, res) => {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', req.session.user.id)
    .order('name')

  res.render('transactions/create', {
    title: 'Tambah Transaksi',
    categories: data || [],
  })
}

exports.store = async (req, res) => {
  const {
    category_id,
    amount,
    transaction_date,
    description,
  } = req.body

  const { error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: req.session.user.id,
        category_id,
        amount,
        transaction_date,
        description,
      },
    ])

  if (error) {
    return res.send(`Error: ${error.message}`)
  }

  res.redirect('/transactions')
}

exports.edit = async (req, res) => {
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', req.params.id)
    .single()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', req.session.user.id)
    .order('name')

  res.render('transactions/edit', {
    title: 'Edit Transaksi',
    transaction,
    categories: categories || [],
  })
}

exports.update = async (req, res) => {
  const {
    category_id,
    amount,
    transaction_date,
    description,
  } = req.body

  await supabase
    .from('transactions')
    .update({
      category_id,
      amount,
      transaction_date,
      description,
    })
    .eq('id', req.params.id)

  res.redirect('/transactions')
}

exports.destroy = async (req, res) => {
  await supabase
    .from('transactions')
    .delete()
    .eq('id', req.params.id)

  res.redirect('/transactions')
}
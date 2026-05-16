const supabase = require('../config/supabase')

exports.index = async (req, res) => {
  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      categories(name, type)
    `)
    .eq('user_id', req.session.user.id)
    .order('transaction_date', { ascending: false })

  res.render('transactions/index', {
    title: 'Transaksi',
    transactions: data || [],
  })
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
  const { category_id, amount, transaction_date, description } = req.body

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
  const { category_id, amount, transaction_date, description } = req.body

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
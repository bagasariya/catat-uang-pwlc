const supabase = require('../config/supabase')

exports.index = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login')
  }

  const userId = req.session.user.id

  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  res.render('categories/index', {
    title: 'Kategori',
    categories: data || [],
  })
}

exports.create = (req, res) => {
  res.render('categories/create', {
    title: 'Tambah Kategori',
  })
}

exports.store = async (req, res) => {
  try {
    const { name, type } = req.body

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: req.session.user.id,
          name,
          type,
        },
      ])

    if (error) {
      console.error('Supabase Error:', error)
      return res.send(`Error: ${error.message}`)
    }

    res.redirect('/categories')
  } catch (err) {
    console.error(err)
    res.send(`Server Error: ${err.message}`)
  }
}

exports.edit = async (req, res) => {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('id', req.params.id)
    .single()

  res.render('categories/edit', {
    title: 'Edit Kategori',
    category: data,
  })
}

exports.update = async (req, res) => {
  const { name, type } = req.body

  await supabase
    .from('categories')
    .update({ name, type })
    .eq('id', req.params.id)

  res.redirect('/categories')
}

exports.destroy = async (req, res) => {
  await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id)

  res.redirect('/categories')
}
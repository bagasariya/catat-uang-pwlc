const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const categoryController = require('../controllers/categoryController')

router.get('/', auth, categoryController.index)
router.get('/create', auth, categoryController.create)
router.post('/create', auth, categoryController.store)
router.get('/edit/:id', auth, categoryController.edit)
router.post('/edit/:id', auth, categoryController.update)
router.get('/delete/:id', auth, categoryController.destroy)

module.exports = router
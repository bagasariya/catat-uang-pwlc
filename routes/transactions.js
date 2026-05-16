const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const transactionController = require('../controllers/transactionController')

router.get('/', auth, transactionController.index)
router.get('/create', auth, transactionController.create)
router.post('/create', auth, transactionController.store)
router.get('/edit/:id', auth, transactionController.edit)
router.post('/edit/:id', auth, transactionController.update)
router.get('/delete/:id', auth, transactionController.destroy)

module.exports = router
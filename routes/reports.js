const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const reportController = require('../controllers/reportController')

router.get('/', auth, reportController.index)
router.get('/pdf', auth, reportController.exportPdf)

module.exports = router
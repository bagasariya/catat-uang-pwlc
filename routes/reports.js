const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const reportController = require('../controllers/reportController')

// Halaman laporan
router.get('/', authMiddleware, reportController.index)

// Export PDF
router.get(
  '/export/pdf',
  authMiddleware,
  reportController.exportPdf
)

// Export Excel
router.get(
  '/export/excel',
  authMiddleware,
  reportController.exportExcel
)

module.exports = router
const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const dashboardController = require('../controllers/dashboardController')

// Halaman Dashboard
router.get('/', authMiddleware, dashboardController.index)

module.exports = router
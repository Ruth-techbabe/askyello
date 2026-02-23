const express = require('express');
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', optionalAuth, searchController.search);
router.get('/categories', searchController.getCategories);

module.exports = router;
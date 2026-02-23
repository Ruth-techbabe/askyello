const express = require('express');
const providerController = require('../controllers/provider.controller');
const { authenticateJWT, optionalAuth } = require('../middleware/auth.middleware');
const { validateProvider } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', optionalAuth, providerController.searchProviders);
router.get('/nearby', optionalAuth, providerController.getNearbyProviders);
router.get('/:id', optionalAuth, providerController.getProviderById);
router.post('/', authenticateJWT, validateProvider, providerController.createProvider);
router.put('/:id', authenticateJWT, validateProvider, providerController.updateProvider);
router.delete('/:id', authenticateJWT, providerController.deleteProvider);

module.exports = router;

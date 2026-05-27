const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require auth
router.use(protect);

// Utility endpoints
router.get('/search', leadsController.searchLeads);
router.get('/owners', leadsController.getOwners);
router.get('/stats', leadsController.getStats);

// CRUD
router.get('/', leadsController.getLeads);
router.post('/', restrictTo('admin', 'manager'), leadsController.createLead);

router.get('/:id', leadsController.getLead);
router.patch('/:id', restrictTo('admin', 'manager'), leadsController.updateLead);
router.delete('/:id', restrictTo('admin'), leadsController.deleteLead);

module.exports = router;
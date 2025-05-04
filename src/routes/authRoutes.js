const db = require('../config/db');
const express = require('express');
const authController = require('../controllers/authController');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/auth/phone-check', authController.checkPhone);

router.post('/auth/phone-register', authController.registerWithPhone);

router.post('/auth/phone-login', authController.loginWithPhone);

router.get('/dash-info', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const result = await db.pgPool.query('SELECT id, phone, f_name, l_name FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    res.json({user});
});

router.post('/create-question', async (req, res) => {
    try {
        const question = new Question(req.body);
        const saved = await question.save();
        return res.status(201).json(saved);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => ({
                path: e.path,
                message: e.message
            }));
            return res.status(400).json({ validationErrors: errors });
        }
        // سایر خطاها
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;

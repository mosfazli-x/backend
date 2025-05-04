const bcrypt = require('bcrypt');
const db = require('../config/db');
const generateToken = require('../utils/generateToken');

exports.checkPhone = async (req, res) => {
    const { phone } = req.body;

    try {
        const user = await db.pgPool.query('SELECT * FROM users WHERE phone = $1', [phone]);

        if (user.rows.length > 0) {
            return res.json({ status: 'EXISTS' });
        }

        const existing = await db.pgPool.query(
            'SELECT * FROM phone_verifications WHERE phone = $1',
            [phone]
        );

        if (existing.rows.length > 0) {
            const lastCreatedAt = new Date(existing.rows[0].created_at);
            const now = new Date();
            const diffMs = now - lastCreatedAt;
            const diffMinutes = diffMs / (1000 * 60);

            if (diffMinutes < 2) {
                return res.status(429).json({
                    error: 'Please wait before requesting another code. ' +
                        `Time left: ${(2 - diffMinutes).toFixed(1)} min`
                });
            }

            // آپدیت کد تأیید
            const code = Math.floor(10000 + Math.random() * 90000).toString();
            await db.pgPool.query(
                `UPDATE phone_verifications SET code = $1, created_at = NOW() WHERE phone = $2`,
                [code, phone]
            );
            // await sendSms(phone, `Your verification code is ${code}`);
            return res.json({ status: 'UPDATED_CODE', code });
        } else {
            // اولین بار: درج رکورد جدید
            const code = Math.floor(10000 + Math.random() * 90000).toString();
            await db.pgPool.query(
                'INSERT INTO phone_verifications (phone, code) VALUES ($1, $2)',
                [phone, code]
            );
            // await sendSms(phone, `Your verification code is ${code}`);
            return res.json({ status: 'NEW_PHONE', code });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginWithPhone = async (req, res) => {
    const { phone, pass } = req.body;

    if (!phone || !pass) {
        return res.status(400).json({ message: 'Phone number and password are required' });
    }

    try {
        const result = await db.pgPool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        const isPasswordMatch = await bcrypt.compare(pass, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = generateToken(user.id);
        res.json({ token, user: { id: user.id, phone: user.phone } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.registerWithPhone = async (req, res) => {
    const { phone, fName, lName, grade, pass, code } = req.body;

    if (!phone || !fName || !lName || !grade || !pass || !code) {
        return res.status(400).json({ message: 'All fields are required including verification code' });
    }

    try {
        const existingUser = await db.pgPool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this phone already exists' });
        }

        const verificationResult = await db.pgPool.query(
            `SELECT * FROM phone_verifications
             WHERE phone = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [phone]
        );

        if (verificationResult.rows.length === 0) {
            return res.status(400).json({ message: 'No verification code found for this phone' });
        }

        const lastVerification = verificationResult.rows[0];

        const createdAt = new Date(lastVerification.created_at);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffMinutes = diffMs / (1000 * 60);
        if (diffMinutes > 2) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        if (lastVerification.code !== code) {
            return res.status(401).json({ message: 'Invalid verification code' });
        }

        const hashedPassword = await bcrypt.hash(pass, 10);

        const insertResult = await db.pgPool.query(
            `INSERT INTO users (phone, f_name, l_name, grade, password)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, phone, f_name, l_name, grade`,
            [phone, fName, lName, grade, hashedPassword]
        );

        const newUser = insertResult.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDashboardInformation = async (req, res) => {
    const { phone, fName, lName, grade, pass, code } = req.body;

    if (!phone || !fName || !lName || !grade || !pass || !code) {
        return res.status(400).json({ message: 'All fields are required including verification code' });
    }

    try {
        const existingUser = await db.gPool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this phone already exists' });
        }

        const verificationResult = await db.pgPool.query(
            `SELECT * FROM phone_verifications
             WHERE phone = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [phone]
        );

        if (verificationResult.rows.length === 0) {
            return res.status(400).json({ message: 'No verification code found for this phone' });
        }

        const lastVerification = verificationResult.rows[0];

        const createdAt = new Date(lastVerification.created_at);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffMinutes = diffMs / (1000 * 60);
        if (diffMinutes > 2) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        if (lastVerification.code !== code) {
            return res.status(401).json({ message: 'Invalid verification code' });
        }

        const hashedPassword = await bcrypt.hash(pass, 10);

        const insertResult = await db.pgPool.query(
            `INSERT INTO users (phone, f_name, l_name, grade, password)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, phone, f_name, l_name, grade`,
            [phone, fName, lName, grade, hashedPassword]
        );

        const newUser = insertResult.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

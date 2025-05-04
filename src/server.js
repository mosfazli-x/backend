require('dotenv').config();
const express = require('express');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
require('./config/passport');
const db = require('../src/config/db');

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use('/api', authRoutes);

db.connectMongo()

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

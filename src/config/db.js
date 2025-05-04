const { Pool } = require('pg');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
require('dotenv').config();

const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
pgPool.on('error', err => {
    console.error('Unexpected Postgres error', err);
    process.exit(-1);
});


async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✔️ Connected to MongoDB via Mongoose');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = {
    pgPool,
    connectMongo
};
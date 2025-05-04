const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;

                let { rows } = await db.pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
                let user = rows[0];

                if (!user) {
                    const insertResult = await pgPool.query(
                        'INSERT INTO users (email) VALUES ($1) RETURNING *',
                        [email]
                    );
                    user = insertResult.rows[0];
                }

                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

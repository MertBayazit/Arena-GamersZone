const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  // Only configure Google Strategy if credentials are provided
  if (clientID && clientSecret && clientID !== 'your_google_client_id') {
    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails[0].value;
            const googleId = profile.id;
            
            // 1. Check if user already has this googleId
            let user = await User.findOne({ googleId });
            if (user) {
              return done(null, user);
            }

            // 2. Check if user exists with the same email
            user = await User.findOne({ email });
            if (user) {
              // Link accounts
              user.googleId = googleId;
              await user.save();
              return done(null, user);
            }

            // 3. Create new user if not found
            // Create a safe username based on google profile
            let baseUsername = profile.displayName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            let username = baseUsername;
            
            // Ensure unique username
            let count = 1;
            while (await User.findOne({ username })) {
              username = `${baseUsername}_${count}`;
              count++;
            }

            user = await User.create({
              username,
              email,
              googleId,
              avatar: {
                type: 'preset',
                value: `avatar_0${Math.floor(Math.random() * 5) + 1}` // Assign random default avatar
              }
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.log('⚠️ Google OAuth is not configured. Google sign-in will not be active.');
  }
};

module.exports = configurePassport;

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "DUMMY_GOOGLE_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "DUMMY_GOOGLE_CLIENT_SECRET",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
            await user.save();
          }
          return done(null, user);
        }

        // Auto-provision user account with default 'donor' role
        user = await User.create({
          name: profile.displayName,
          email: email,
          password: "OAUTH_USER_" + Math.random().toString(36),
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          role: "donor",
          authProvider: "google"
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

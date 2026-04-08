import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User';

export const initPassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: unknown, user?: Express.User | false) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: email || '',
              avatar: avatar || '',
            });
          } else {
            if (avatar && user.avatar !== avatar) {
              user.avatar = avatar;
              await user.save();
            }
          }

          return done(null, user as Express.User);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

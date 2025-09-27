New user flow
1. Splash screen
2. Welcome onboarding flow (5 slides)
3. Auth screen (user register for new account)
4. Verify screen (email verification), enter code from email sent
5. Create profile screen (setup name, phone, elderly/not elderly, age)
6. Boarding screen (got option 'create family group' or 'enter family code')
7. Home screen (if new user, choose to enter existing family group code)

New user flow (2nd flow)
1. Splash screen
2. Welcome onboarding flow (5 slides)
3. Auth screen (user register for new account)
4. Verify screen (email verification), enter code from email sent
5. Create profile screen (setup name, phone, elderly/not elderly, age)
6. Boarding screen (got option 'create family group' or 'enter family code')
7. Create family group screen (if new user, choose to create family group)

Existing user flow (completed profile)
1. Splash screen
2. Home screen

Returning user flow (incomplete profile)
1. Splash screen
2. Auth screen (if session expired)
3. Create profile screen (if profile incomplete)
4. Boarding screen
5. Home screen

Remark:
- If existing user sign out, it will navigate them to auth screen
- If user closes the app (clear recent app/tab) then opens back the app:
  - Complete profile: splash screen -> home screen (no onboarding flow)
  - Incomplete profile: splash screen -> create profile screen -> boarding screen -> home screen
- Welcome onboarding flow only shows on fresh app install
- If user has verified email but incomplete profile, they resume from create profile screen
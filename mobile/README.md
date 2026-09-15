# GymApp member app (Flutter)

Android first. API defaults to the hosted gym: **https://gymapp.learnwise.in/api**.

## Run

```powershell
cd mobile
flutter pub get
flutter run
```

Optional overrides:

```powershell
flutter run --dart-define=API_BASE=https://gymapp.learnwise.in/api --dart-define=API_ORIGIN=https://gymapp.learnwise.in
```

## Firebase (required for Google and phone OTP)

1. Create a Firebase project and add Android app `in.learnwise.gymapp.member`.
2. Enable **Google** and **Phone** sign-in.
3. Add your debug (and later release) SHA-1.
4. In `mobile/` run `flutterfire configure` and replace `lib/firebase_options.dart`.
5. Place `google-services.json` in `android/app/` if the Firebase console provides it.
6. On the server, set `FIREBASE_SERVICE_ACCOUNT` in `.env.production` to the Firebase Admin JSON (single line) and rebuild the API.

Login only works if that Gmail or mobile already exists on an **active Member** in the CRM.

## After deploying backend member APIs

The Flutter app calls `/api/member-app/*`. Deploy the Nest changes to https://gymapp.learnwise.in before testing login on a device.

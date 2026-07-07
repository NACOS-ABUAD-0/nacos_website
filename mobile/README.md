# NACOS ABUAD Mobile

React Native (Expo) app for NACOS ABUAD students — events, resources, projects,
an AI assistant, and notifications. Reuses the same Django REST Framework API
as the web frontend (`../backend/`, `../frontend/`).

## Stack

- **Expo Router** (file-based routing, `src/app/`)
- **NativeWind** (Tailwind classes on React Native components)
- **React Query** (`@tanstack/react-query`) for all server data
- **expo-secure-store** for JWT token persistence
- **expo-notifications** for push (see limitations below)

## Local development

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your dev
   machine's **LAN IP** (not `127.0.0.1` — a phone can't reach that). Find it
   with `ipconfig` (Windows) / `ifconfig` (Mac/Linux).
3. Add that same LAN IP to `backend/.env`'s `DJANGO_ALLOWED_HOSTS`
   (comma-separated), and run Django with
   `python manage.py runserver 0.0.0.0:8000` — the `0.0.0.0` bind is required
   for the phone to reach it at all.
4. `npx expo start`, scan the QR code with the **Expo Go** app (iOS/Android)
   or press `w` for a browser preview.

## Project structure

```
src/
  app/
    (auth)/           login, register, forgot/reset password, verify email
    (tabs)/            home, events, resources, projects, assistant, profile
    notifications.tsx  modal notification list
    _layout.tsx        root layout — auth gating via Stack.Protected
  components/          shared UI (buttons, form fields, project card)
  context/AuthContext.tsx
  lib/
    api.ts             axios instance + all per-domain API objects
    tokenStorage.ts     SecureStore-backed token cache
    pushNotifications.ts
    hooks/              React Query hooks, one file per domain
```

## What's intentionally out of scope for v1

- **Admin panel** — stays web-only (`../frontend/src/admin1/`).
- **Project create/edit** — the web `ProjectForm.tsx` is an 804-line dynamic
  form (tags, links, image uploads, collaboration-needs arrays). Mobile v1
  ships browse/apply/my-collaborations only.
- **Face login** — optional feature on web, skipped entirely for mobile v1.
- **QR scanning** — students only display their own registration QR code;
  admin check-in scanning remains a web/admin-panel feature.

## Push notifications — current limitations

Push is wired end-to-end (backend `DeviceToken` model + Expo push API calls,
mobile permission request + token registration — see
`src/lib/pushNotifications.ts`), but two things gate testing it for real:

1. **No EAS project yet** — `getExpoPushTokenAsync()` needs an EAS
   `projectId` (see setup below). Until that exists, push registration
   silently no-ops (by design — it never blocks or errors visibly).
2. **Android + Expo Go don't mix for push** — since Expo SDK 53, Expo Go
   cannot receive remote push notifications on Android at all. A
   development build (`eas build --profile development`) is required to
   test push on Android. iOS Expo Go does support it.

## Setting up EAS Build & app store submission

This part needs **your own accounts** — nothing here can be done on your
behalf without them:

- A free [Expo account](https://expo.dev/signup) (for EAS)
- An [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year) for iOS
- A [Google Play Console](https://play.google.com/console/signup) account ($25 one-time) for Android
- A hosted **privacy policy** page (both stores require the URL at submission —
  the main site at nacosabuad.org would be a natural place for this)

Once you have those:

```bash
npm install -g eas-cli   # or use `npx eas-cli` without a global install
eas login                # authenticates with your Expo account
eas init                 # links this project, fills in app.json's extra.eas.projectId
eas build:configure       # confirms eas.json build profiles (already present in this repo)

# Development build (needed for testing push on Android, or any native
# module not supported in Expo Go):
eas build --platform android --profile development

# Store-ready builds:
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to the stores (after a production build finishes):
eas submit --platform ios
eas submit --platform android
```

App Store Connect / Play Console will also ask for: screenshots (several
device sizes each), a short + full description, a content rating
questionnaire, a support URL, and the privacy policy URL mentioned above —
none of that can be prepared without knowing final store listing copy, so
it's left for you to fill in when you reach that step.

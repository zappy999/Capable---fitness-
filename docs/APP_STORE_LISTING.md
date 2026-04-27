# App Store Connect listing copy

Paste-ready text for every field in the App Store Connect submission
form. Each section names the exact field label App Store Connect uses
and shows a character count budget where Apple imposes one.

> Bundle ID: `com.tompearce.capable` · Version: `1.0.0`

---

## App name (30 char max)

```
Capable
```

If `Capable` is taken on the App Store (likely), here are fallbacks
that read naturally:

- `Capable Lifts` (13)
- `Capable: Lifting` (16)
- `Capable Fitness` (15)

The display name doesn't have to match `app.json`'s `name` — pick
whichever is available and we'll keep the in-app name as `Capable`.

## Subtitle (30 char max)

```
Local-first lifting tracker
```

(27 chars) Alternatives if you want a more aggressive hook:

- `Lift. Log. No analytics.` (24)
- `Tap-efficient gym tracker` (25)

## Promotional Text (170 char max — editable between updates without re-review)

```
Local-first lifting tracker. Tap to log, swipe to complete, circular rest timer. No account, no analytics — just your reps and your phone.
```

(138 chars)

## Description (4000 char max — recommended <2000)

```
Capable is a tap-efficient workout tracker for people who actually log every set. It's built around three things: speed of logging, clarity of what's next, and a firm "no account, no analytics, no servers" stance.

BUILT FOR THE WORKING SET
• Swipe-to-complete set card so you can log one-handed between reps
• Circular rest timer in a persistent bottom bar — put the phone down and a local notification fires when it's done
• Numeric weight steppers tuned to your weight increment
• Set chips show RIR, drop sets, supersets, tempo, and PR trophies inline

PROGRAMS THAT TRAVEL
• Group workouts into a program. The home screen shows what's up next based on what you've already done this week
• Edit workouts on the fly without losing your spot
• Active program highlighted with an accent border across the app

STATS THAT MEAN SOMETHING
• Weekly volume, muscle split, est. 1RM trend, longest streak
• Personal records detected automatically and surfaced as a small chip on the set — not a confetti modal
• All derived from the sets you log, not an opaque score

LOCAL-FIRST, BY DESIGN
• No account to make. Open the app and start
• No analytics SDK, no server, no data leaves your device
• Export your full history to JSON anytime; re-import on a new phone

Designed for iOS, optimized for one-handed use mid-workout. Dark UI by default. iPhone and iPad.

Privacy policy: https://zappy999.github.io/Capable---fitness-/privacy/
Support: https://zappy999.github.io/Capable---fitness-/support/
```

## Keywords (100 char max — comma-separated, no need to repeat the title)

```
workout,lifting,gym,sets,reps,PR,program,rest timer,strength,training,hypertrophy,log,1RM
```

(89 chars) Apple recommends no spaces after commas to maximize density.
The 13 terms above cover the most-searched lifting-app queries while
staying under the cap.

## What's New in This Version (4000 char max)

For 1.0:

```
Welcome to Capable. Version 1.0 ships with:

• Tap-to-log workouts with swipe-to-complete set cards
• Circular rest timer in a persistent bottom bar with local notifications
• Per-set RIR tracking
• Personal record detection (heaviest weight, best volume) surfaced as inline trophy chips
• Programs that group workouts and tell you what's up next on Home
• Weekly volume + muscle split charts in Stats
• Full JSON backup / restore — your data stays on your device

Built for one-handed use mid-workout, dark-only, optimized for iOS 17+.
```

## URLs

| Field | Value |
|---|---|
| Privacy Policy URL | `https://zappy999.github.io/Capable---fitness-/privacy/` |
| Support URL | `https://zappy999.github.io/Capable---fitness-/support/` |
| Marketing URL (optional) | `https://zappy999.github.io/Capable---fitness-/preview/` |

## Category

| Field | Value |
|---|---|
| Primary category | Health & Fitness |
| Secondary category (optional) | Lifestyle |

## Age rating

Run through Apple's questionnaire and answer **None** to every
content type. Capable should land at **4+** — no objectionable
content, no in-app browser, no user-generated content, no chat.

## Pricing

Free.

## Availability

All territories.

## App Privacy ("nutrition labels")

Declare **Data Not Collected**. Capable does not collect, transmit, or
share any personal data. Everything is local AsyncStorage on device.

If Apple's UI requires you to confirm specific categories:

- **Contact Info** — Not Collected
- **Health & Fitness** — Not Collected (your sets are stored locally
  but never leave the device, so this doesn't qualify as "collected"
  per Apple's definition)
- **Financial Info** — Not Collected
- **Location** — Not Collected
- **Sensitive Info** — Not Collected
- **Contacts** — Not Collected
- **User Content** — Not Collected
- **Browsing History** — Not Collected
- **Search History** — Not Collected
- **Identifiers** — Not Collected
- **Purchases** — Not Collected
- **Usage Data** — Not Collected
- **Diagnostics** — Not Collected
- **Other Data** — Not Collected

## App Review Information (the message reviewers see)

### Sign-In Required
**No.**

### Demo account
Leave blank — none required.

### Contact Information
| Field | Value |
|---|---|
| First name | _your first name_ |
| Last name | _your last name_ |
| Phone | _your phone with country code_ |
| Email | `capablefitness@proton.me` |

### Notes for the reviewer

```
Capable does not require a sign-in or account. Reviewers can launch the app and use it immediately — first launch seeds 8 weeks of demo workout sessions so the Stats, Program, and PR screens are populated for review without any setup.

To exercise the core flows:

1. Home tab → tap the "Up next" card or any workout → "Start workout" opens the active session.
2. In an active session, swipe a set card to the right (or tap the "More" button on the set card) to mark a set complete. Tap "Start rest" or finish a set to start the rest timer. iOS will prompt for notification permission the first time — allowing it lets the app fire a single local notification when the rest timer ends. Denying it does not disable any other feature; the in-app countdown still works.
3. Stats tab shows aggregate progress derived from the seeded sessions (volume, muscle split, achievements).
4. Program tab → tap a program → "Set active" → return to Home. The "Up next" card reflects the active program's next workout.
5. Settings → About lists the running version, the privacy policy URL, and the support URL.

The app does not collect or transmit any personal data. There is no remote API, no analytics SDK, no third-party telemetry. All storage is local AsyncStorage on device. The only system permission requested is local notifications (for the rest timer) — there is a NSUserNotificationsUsageDescription string in Info.plist explaining this.

Privacy policy: https://zappy999.github.io/Capable---fitness-/privacy/
Support contact: capablefitness@proton.me
```

### Attachment

None required for 1.0. If the reviewer asks for a build for an older
device or a video walkthrough, attach via the Resolution Center.

---

## Screenshots checklist

Sizes to upload (Apple downscales for smaller devices automatically):

| Device class | Required | Size |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max) | min 3, max 10 | 1320×2868 px |
| iPhone 6.5" (iPhone 11 Pro Max) | min 3 | 1242×2688 px |
| iPad 13" (iPad Pro M4) | min 3 | 2064×2752 px |

Suggested screens to feature, in this order:

1. Home — Up Next card with accent border + week dot grid + recent sessions
2. Start Workout — set card mid-swipe + the circular rest timer in the bottom bar
3. Stats — volume chart + muscle split
4. Program detail — active program with attribute pills + workout list
5. Session detail — set chips with PR trophy + RIR pill
6. (Optional) PR log — most-recent PR with NEW badge

If you're on a Mac with Xcode, the easiest way:

```bash
# In one terminal
npm start

# In another, after picking a device in Xcode → Open Developer Tool → Simulator
xcrun simctl io booted screenshot ~/Desktop/capable-home.png
```

For the iPad shot, boot an iPad Pro M4 simulator and repeat. PNGs at
the listed sizes go straight into the App Store Connect uploader — no
device frame required (Apple no longer enforces frames).

# App Store submission checklist

End-to-end steps to get Capable from this repo into the App Store.
Codeside prep is already done on `claude/app-store-prep` — everything
below is what _you_ need to do externally and which CLI commands to
run from this machine.

> **Bundle identifier:** `com.tompearce.capable`
> **App version:** `1.0.0`  ·  **Initial build number:** `1`

---

## 0. One-time prerequisites (~30 min, ~$99/yr)

- [ ] **Enroll in the Apple Developer Program** at
  <https://developer.apple.com/programs/> ($99/year). Use the same
  Apple ID you'll publish with.
- [ ] Once enrolled, note your **Team ID** (10-char alphanumeric, e.g.
  `ABCDE12345`). It's at <https://developer.apple.com/account>.
- [ ] Install EAS CLI globally if you haven't:
  ```bash
  npm install -g eas-cli
  eas login
  ```

## 1. Publish the privacy policy and support page (~5 min)

The pages are already authored under `docs/` (this folder) and the
in-app Settings → About links already point at the GitHub Pages URLs
they'll have once you flip the switch.

- [ ] Go to <https://github.com/zappy999/Capable---fitness-/settings/pages>.
- [ ] Under **Build and deployment**:
  - **Source:** Deploy from a branch
  - **Branch:** `main` · folder `/docs` · **Save**
- [ ] Wait ~1-2 minutes. Refresh the Pages settings page until it
  shows the live URL near the top:
  `https://zappy999.github.io/Capable---fitness-/`
- [ ] Verify both pages load:
  - <https://zappy999.github.io/Capable---fitness-/privacy/>
  - <https://zappy999.github.io/Capable---fitness-/support/>
- [ ] These are the URLs you'll paste into App Store Connect in step 4.

## 2. Create the App Store Connect record (~15 min)

- [ ] Go to <https://appstoreconnect.apple.com/apps>, click `+`, "New
  App".
- [ ] **Platform:** iOS  ·  **Name:** Capable
  - If "Capable" is taken (likely on iOS), pick a longer brand name
    (e.g. "Capable Lifts") — this is the App Store display name, not
    the bundle id.
- [ ] **Primary language:** English (U.S.)
- [ ] **Bundle ID:** `com.tompearce.capable` — the picker will show
  it once Apple registers it from EAS the first time you build.
  - You can also pre-register it at
    <https://developer.apple.com/account/resources/identifiers/list>.
- [ ] **SKU:** anything unique (e.g. `capable-001`).
- [ ] After creation, copy the numeric **Apple ID** (also called
  `ascAppId`) from the App Information page.

## 3. Wire EAS submit (~2 min)

Edit [`eas.json`](../eas.json) → `submit.production.ios` and replace
the two placeholders:

```jsonc
"ascAppId": "1234567890",         // numeric ID from App Store Connect
"appleTeamId": "ABCDE12345"        // Team ID from developer.apple.com
```

## 4. Fill in App Store Connect metadata (~30 min)

All the paste-ready copy lives in
[**APP_STORE_LISTING.md**](./APP_STORE_LISTING.md) — open it side by
side with the App Store Connect form. It covers:

- App name + subtitle (with fallbacks if `Capable` is taken)
- Promotional Text (170 char)
- Description (~1700 char)
- Keywords (89/100 char)
- "What's New in This Version" for 1.0
- All four URLs (privacy, support, marketing, source)
- Category, age rating answers, pricing
- App Privacy "nutrition labels" — every category set to Not Collected
- App Review notes (no-account flow, how to test the rest-timer
  notification path, all the disclosures the reviewer needs)
- Screenshot sizing table with `xcrun simctl` capture commands

## 5. Screenshots (~30-45 min)

Required sizes for iOS App Store (you only need to provide the
largest size in each device class — Apple downscales):

- **iPhone 6.9" (iPhone 16 Pro Max)** — 1320×2868 px (3 minimum, 10 max).
- **iPhone 6.5" (iPhone 11 Pro Max)** — 1242×2688 px (3 minimum).
- **iPad 13" (M4 iPad Pro)** — 2064×2752 px (3 minimum, only if you
  ship for iPad — `supportsTablet: true` is set, so yes).

Capture from a Simulator at the right device, or take real-device
screenshots and crop. Suggested screens to feature:
1. Home (with "Up next" card + dot grid).
2. Start workout — set card with swipe-to-complete + circular rest
   timer in bottom bar.
3. Stats — volume chart + muscle split.
4. Program detail — active program with attribute pills.
5. Session detail with PR badges.
6. (Optional) PR log.

## 6. Build (~15 min wall, ~5 min compute)

```bash
# First build — EAS will provision certs and provisioning profiles
# automatically; answer "yes" when it offers to handle them for you.
eas build --platform ios --profile production
```

When the build finishes you'll get an `.ipa` in EAS's dashboard.
There's nothing to manually upload; `eas submit` does that next.

## 7. Submit (~5 min)

```bash
eas submit --platform ios --profile production
```

This pushes the build to App Store Connect and attaches it to the
1.0.0 record you created in step 2.

## 8. Submit for review (~5 min, then 24-48h wait)

In App Store Connect → 1.0.0 → top-right "Add for Review", then
"Submit to App Review". Apple will email when status changes.

If Apple rejects:
- Read the resolution center note carefully.
- Common 1.0 rejections: missing privacy policy URL (we have one),
  permission strings that don't say _why_ (we wrote one for
  notifications), or features the reviewer can't reach (we have no
  account wall).

## 9. Future updates

To ship a new version:
1. Bump `expo.version` in `app.json` (e.g. `1.0.1`).
2. `eas build -p ios --profile production` — `autoIncrement: true`
   in `eas.json` bumps the build number for you.
3. `eas submit -p ios --profile production`.
4. Add a "What's New in This Version" note in App Store Connect.
5. Submit for review.

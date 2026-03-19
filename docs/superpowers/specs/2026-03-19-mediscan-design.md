# MediScan — Design Specification
**Date:** 2026-03-19
**Version:** 1.3
**Status:** Approved
**Platform:** iOS & Android (React Native + Expo Managed + EAS Development Build)
**Scope:** Phases 1–3 (Scanner, Brand Names, Scheduler)
**Expo SDK:** 52
**Min iOS:** 16.0 | **Min Android:** API 26 (Android 8.0)

---

## 1. Overview

MediScan is a cross-platform mobile app that lets users point their phone camera at a medicine — box, blister pack, bottle, or loose pill — and instantly see what it is, what it treats, its risks, and its local brand name. Users can then schedule medications and receive push notification reminders.

**Out of scope for this implementation:** Supabase auth, cloud sync, multi-device access, onboarding flow, App Store submission (Phases 4–5).

### Build Workflow Note
Although the project uses the Expo managed workflow, `@react-native-ml-kit/text-recognition` requires a custom native module that is incompatible with standard Expo Go. The project uses **EAS Development Build** (a custom dev client) throughout development. This is still managed workflow — no ejection required.

---

## 2. Visual Design

| Token | Value |
|---|---|
| Primary | `#1A6FB4` |
| Primary light | `#E8F4FD` |
| Background | `#F5F9FD` |
| Surface | `#FFFFFF` |
| Text primary | `#1A1A1A` |
| Text secondary | `#666666` |
| Danger | `#D32F2F` |
| Warning | `#F57C00` |
| Border | `#E0E0E0` |

| Scale | Size |
|---|---|
| text-xs | 11px |
| text-sm | 13px |
| text-base | 15px |
| text-lg | 17px |
| text-xl | 20px |
| text-2xl | 24px |

- **Spacing unit:** 4px base (4, 8, 12, 16, 24, 32)
- **Border radius:** 6px (sm), 10px (md), 16px (lg), 9999px (pill)
- **Icon library:** `@expo/vector-icons` (Ionicons set)
- **Typography:** System font (San Francisco on iOS, Roboto on Android)
- **Medical disclaimer:** displayed at the bottom of every Drug Info Card, non-removable

---

## 3. Navigation Structure

**Pattern:** Scanner-First — Home dashboard with central floating action button (FAB) that opens the scanner. Persistent bottom nav with 4 tabs (no dedicated "Home" tab button).

**Home screen routing:** `app/(tabs)/index.tsx` is the initial/default route shown on app launch. It is not a visible bottom nav tab — it is what the user sees before tapping any tab. The bottom nav's five items (Cabinet, Schedule, FAB, History, Settings) do not include a Home button. Tapping the FAB from any screen opens the scanner; the Home dashboard is only the launch screen.

```
Bottom Nav:
  [Cabinet]   [Schedule]   [📷 FAB]   [History]   [Settings]
```

- **Cabinet:** All saved medicines
- **Schedule:** Dose calendar and medication management (add/edit/remove medications, view upcoming doses)
- **FAB (centre):** Opens Camera/Scanner — the primary entry point of the app
- **History:** Dose log history (taken / skipped / missed records)
- **Settings:** Notification preferences, country override, app version, legal disclaimer

**Home dashboard** (shown on app open): two sections — "Recent Scans" (last 5 scans) and "Today's Reminders" (upcoming doses for today). Empty state shown when neither section has data.

### Screen Map

| Screen | Navigates To |
|---|---|
| Home | Scanner (FAB), Drug Info Card (recent scan), Schedule |
| Camera View | Processing Screen |
| Processing Screen | Drug Info Card, Manual Search (if all identification fails) |
| Drug Info Card | Add to Schedule, Save to Cabinet |
| Manual Search | Drug Info Card |
| Medicine Cabinet | Drug Info Card, Edit Schedule |
| Schedule | Add/Edit Medication |
| Add/Edit Medication | Schedule |
| History | — (view only) |
| Settings | — |

**Drug Info Card** is a shared screen reachable from Scanner, Cabinet, and Home (recent scans).

---

## 4. Data Flow — Scan to Drug Info Card

### 4.1 Identification Pipeline (sequential, with fallbacks)

Each step only runs if the previous step fails to return a usable drug name.

| Step | Tool | Phase | Notes |
|---|---|---|---|
| 1. Camera capture | `expo-camera` | Phase 1 | Still photo or live scan |
| 2. On-device OCR | `@react-native-ml-kit/text-recognition` | Phase 1 | Free, no network call |
| 3. INN resolution | PubChem name search (synonym lookup) | Phase 1 | Maps OCR text to canonical INN |
| 4. Pill ID fallback | NLM RxImage API | Phase 1 | For unlabelled pills — imprint + shape + colour |
| 5. Manual Search | User types drug name | Phase 1 | Always available as escape hatch |
| 6. AI fallback | Gemini Flash Vision API | Phase 2 | For unreadable labels (~$0.0001/call) |

**OCR-to-INN Resolution Logic (Step 3):**
1. Run regex extraction on OCR output to isolate candidate drug name tokens (ignore dosage numbers, "mg", "ml", manufacturer text)
2. Send candidate tokens to `GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{token}/JSON`
3. If PubChem returns a compound, extract `IUPACName` or first `Synonym` as canonical INN
4. For multi-ingredient products, extract all candidate tokens and resolve each separately; display as a combined card
5. Confidence threshold: if PubChem returns no match for a token, discard it and try next token
6. If no tokens resolve, advance to Step 4 (NLM RxImage)

**Note on Gemini Flash (Step 6):** The Gemini API call transmits a camera image to Google's servers. This image contains no user PII and is not linked to any user identity. This is explicitly acknowledged in the in-app privacy notice. Users are shown a one-time prompt before the first Gemini fallback is triggered.

### 4.2 Drug Data Queries (parallel, React Query cached)

Once a canonical INN is resolved, four queries fire simultaneously:

| Hook | Source | Returns | Cache TTL |
|---|---|---|---|
| `usePubChemQuery(name)` | PubChem REST (NIH) | compoundId, description, synonyms, molecular formula | 24h |
| `useChEMBLQuery(name)` | ChEMBL REST (EMBL-EBI) | drugClass, mechanism of action, indications (used for), sideEffects, dosage, interactions, warnings | 24h |
| `useWikidataQuery(name, country)` | Wikidata SPARQL | localBrandName, allBrandNames[] by country | 1h |
| `useRegionalQuery(name, country)` | See §4.3 | regionalBrands, prescriptionStatus | 1h |

Country is detected silently from device locale via `expo-localization` — no permission required.

**`useRegionalQuery` for unknown countries:** Returns `null` for both `regionalBrands` and `prescriptionStatus`. Brand names for these countries are already covered by `useWikidataQuery`. There is no duplicate Wikidata call — the regional hook short-circuits immediately for unlisted countries. `prescriptionStatus` for unknown countries is derived from Wikidata property **P3780** (has brand name) + **P6541** (prescription status) via the Wikidata SPARQL query in `useWikidataQuery`; if neither property is present, `prescriptionStatus` is displayed as "Varies by country."

**Field-to-Source Mapping:**

| Drug Info Card Field | Primary Source | Fallback |
|---|---|---|
| Generic name (INN) | PubChem synonym / IUPACName | OCR text |
| Local brand name | Wikidata (by country) | Regional source |
| Other brand names | Wikidata (all countries) | — |
| Drug class | ChEMBL `therapeuticFlag` / `drugClass` | PubChem description |
| Used for (indications) | ChEMBL `indication_class` | PubChem description |
| Dosage guidance | ChEMBL `max_phase` + `dose` fields | Empty — show "Consult your doctor" |
| Key benefits | ChEMBL indications narrative | PubChem description |
| Side effects | ChEMBL adverse effects | Empty — show "See package insert" |
| Drug interactions | ChEMBL mechanism + target data | Empty — show "See package insert" |
| Warnings | ChEMBL black box warning fields | PubChem safety section |
| Prescription required? | Regional source | Wikidata P3780 + P6541; displays "Varies by country" if neither present |

**When a field cannot be populated from any source**, display "Information not available for this medicine" rather than an empty row. Never hide the row entirely.

**Source conflict resolution:** ChEMBL takes precedence over PubChem for clinical fields (drug class, indications, side effects). Wikidata takes precedence over regional sources for brand names unless the regional source returns an exact match for the user's country.

**API timeouts:** All requests have a 10-second timeout. React Query retry: 2 attempts with 1s exponential backoff. If a query times out, that card section displays "Could not load — tap to retry."

### 4.3 Regional Source Routing

| Country | Source | Auth Required | Access Method |
|---|---|---|---|
| US | OpenFDA | No | REST API, no key |
| EU | EMA (EPAR product list) | No | Public CSV/REST |
| UK | NHS dm+d | Yes — free registration | API key stored in EAS Secrets |
| India | Indian-Medicine-Dataset | No | Bundled SQLite file (at build time from GitHub release asset) |
| Australia | Wikidata SPARQL | No | Falls back to global Wikidata (TGA has no usable public REST API) |
| All others | Wikidata SPARQL | No | Global fallback |

**Indian Medicine Dataset:** Downloaded from the GitHub release at build time and bundled as a static SQLite file in the app bundle (`assets/india-medicines.db`). Approximately 60,000 entries. Updated with each app release.

**NHS dm+d API key:** Stored as an EAS Secret (`NHS_DMD_API_KEY`). Injected into the app at build time via `app.config.js` as `process.env.EXPO_PUBLIC_NHS_DMD_API_KEY`. If absent, the UK regional lookup is skipped and Wikidata is used.

### 4.4 Drug Info Card Layout

Scrollable card with sections in this order:
1. Header: generic name (large), local brand name (prominent subtitle), other brand names (collapsible)
2. Chip row: drug class tag, prescription status tag
3. Section: Used For
4. Section: Dosage Guidance
5. Section: Key Benefits
6. Section: Side Effects
7. Section: Drug Interactions
8. Section: Warnings
9. Action buttons: "Add to Schedule" | "Save to Cabinet"
10. Footer: Medical disclaimer (fixed, non-scrollable)

**Loading state:** While queries are in-flight, show skeleton placeholders for each section. Sections populate as their respective queries resolve (progressive loading — do not wait for all four queries to finish).

---

## 5. State Management

### 5.1 Zustand Stores

All stores use `zustand/middleware/persist` with a custom storage adapter backed by `expo-sqlite`. The adapter implements the `StateStorage` interface: `getItem`, `setItem`, `removeItem` — each serialising store state as JSON in a key-value table.

**`useMedicineCabinetStore`**
```
medicines: Medicine[]
  id: string (uuid)
  genericName: string
  localBrandName: string
  drugClass: string
  lastScannedAt: ISO8601 string
  savedAt: ISO8601 string
  drugInfoSnapshot: DrugInfo (serialised JSON)
actions: addMedicine, removeMedicine, updateMedicine
```

**`useScheduleStore`**
```
schedules: Schedule[]
  id: string (uuid)
  medicineId: string (FK → medicines.id)
  genericName: string  (denormalised for display)
  doseAmount: string   (e.g. "500mg", "1 tablet")
  frequency: FrequencyType (see §5.3)
  times: string[]      (ISO time strings, e.g. ["08:00", "20:00"])
  startDate: ISO8601 date string
  endDate: ISO8601 date string | null
  notes: string
  notificationIds: string[]  (Expo Notification identifiers)
  isActive: boolean

doseLog: DoseEntry[]   ← read-through cache only (see note below)
  id, scheduleId, scheduledAt, status, loggedAt

actions: addSchedule, updateSchedule, cancelSchedule, logDose,
         loadDoseLogFromDB(entries)   ← hydrates doseLog on startup
```

**dose_log write authority:** `doseLog` in Zustand is a **read-through cache**. The canonical store is the `dose_log` SQLite table, written directly via `src/db/database.ts` for performance (avoids serialising the full Zustand state on every dose event). On app startup, `database.ts` reads all `dose_log` rows and calls `loadDoseLogFromDB()` to populate the Zustand cache. The History screen reads from `useScheduleStore().doseLog`. `logDose()` writes to both SQLite and the in-memory Zustand array atomically.

**`useAppStore`** (in-memory, not persisted)
```
country: string       (ISO 3166-1 alpha-2, from expo-localization)
lastScanResult: DrugInfo | null
notificationsEnabled: boolean
```

### 5.2 SQLite Schema

Tables managed by `src/db/database.ts`. No migration library for Phases 1–3 — schema is created fresh on first launch via `CREATE TABLE IF NOT EXISTS`.

```sql
-- Key-value store for Zustand persistence
CREATE TABLE IF NOT EXISTS kv_store (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Dose log (written directly, not via Zustand for performance)
CREATE TABLE IF NOT EXISTS dose_log (
  id            TEXT PRIMARY KEY,
  schedule_id   TEXT NOT NULL,
  scheduled_at  TEXT NOT NULL,
  status        TEXT NOT NULL CHECK(status IN ('taken','skipped','missed')),
  logged_at     TEXT
);
```

Note: `expo-sqlite` (standard, unencrypted) is used in Phases 1–3. Encryption via SQLCipher is deferred to Phase 4 (requires bare workflow or a custom dev build plugin). This is an acknowledged limitation.

### 5.3 Dose Frequency Options

| FrequencyType | Display Label | Times Array | Expo Trigger Type |
|---|---|---|---|
| `once_daily` | Once daily | `["08:00"]` (default) | `DailyTriggerInput` |
| `twice_daily` | Twice daily | `["08:00","20:00"]` | Two `DailyTriggerInput` |
| `three_daily` | Three times daily | `["08:00","14:00","20:00"]` | Three `DailyTriggerInput` |
| `every_4h` | Every 4 hours | — | `TimeIntervalTriggerInput` (14400s) |
| `every_6h` | Every 6 hours | — | `TimeIntervalTriggerInput` (21600s) |
| `every_8h` | Every 8 hours | — | `TimeIntervalTriggerInput` (28800s) |
| `every_12h` | Every 12 hours | — | `TimeIntervalTriggerInput` (43200s) |
| `as_needed` | As needed | — | No notification scheduled |
| `custom` | Custom | User-defined time array | One `DailyTriggerInput` per time |

### 5.4 Key Principle

Zustand owns **user data** (saved medicines, schedules, dose logs).
React Query owns **drug data** (API responses, ephemeral).
These never mix — Drug Info Card reads from React Query; Cabinet and Schedule read from Zustand.

---

## 6. API Key Management

| Key | EAS Secret | Injected Env Var |
|---|---|---|
| Gemini Flash API key | `GEMINI_API_KEY` | `EXPO_PUBLIC_GEMINI_API_KEY` |
| NHS dm+d API key | `NHS_DMD_API_KEY` | `EXPO_PUBLIC_NHS_DMD_API_KEY` |

If `EXPO_PUBLIC_GEMINI_API_KEY` is absent, the Gemini fallback step is skipped and manual search is offered immediately.

**Security note:** The `EXPO_PUBLIC_` prefix embeds values into the JavaScript bundle, making them extractable from the app binary. To mitigate:
- The Gemini API key must be restricted to the app's bundle ID in Google Cloud Console (Application Restrictions → Android/iOS app)
- The NHS dm+d key must be restricted to the expected referrer/IP in the NHS developer portal
- This is an accepted risk for Phases 1–3 (development builds, limited distribution). Phase 4 remediation: route all keyed API calls through a lightweight server-side proxy (e.g., a Supabase Edge Function) so keys never ship in the bundle.

---

## 7. Technology Stack

| Layer | Tool | Version | Cost |
|---|---|---|---|
| Mobile framework | React Native + Expo Managed | SDK 52 | Free |
| Build | EAS Development Build + EAS Build | — | Free tier |
| Camera | `expo-camera` | latest | Free |
| On-device OCR | `@react-native-ml-kit/text-recognition` | latest | Free |
| Pill ID | NLM RxImage API (NIH) | — | Free |
| AI fallback | Google Gemini Flash Vision | — | ~$0.0001/call |
| Drug data | PubChem REST API | — | Free |
| Drug data | ChEMBL REST API | — | Free |
| Brand names | Wikidata SPARQL | — | Free |
| Regional (IN) | Indian-Medicine-Dataset (bundled SQLite) | — | Free |
| Regional (US) | OpenFDA | — | Free |
| Regional (UK) | NHS dm+d | — | Free (registration) |
| Regional (EU) | EMA EPAR | — | Free |
| Region detection | `expo-localization` | latest | Free |
| Local storage | `expo-sqlite` | latest | Free |
| Push notifications | `expo-notifications` | latest | Free |
| State management | `zustand` | ^5 | Free |
| API caching | `@tanstack/react-query` | ^5 | Free |
| Navigation | Expo Router | v4 | Free |
| Icons | `@expo/vector-icons` (Ionicons) | latest | Free |

---

## 8. Project Structure

```
mediscan/
├── app/                              # Expo Router (file-based routing)
│   ├── (tabs)/
│   │   ├── index.tsx                 # Home dashboard
│   │   ├── cabinet.tsx               # Medicine Cabinet
│   │   ├── schedule.tsx              # Schedule / dose management
│   │   ├── history.tsx               # Dose log history
│   │   └── settings.tsx             # Settings
│   ├── scanner/
│   │   ├── index.tsx                 # Camera View
│   │   └── processing.tsx            # Processing screen (pipeline in progress)
│   ├── drug/
│   │   └── [name].tsx                # Drug Info Card (shared)
│   ├── search.tsx                    # Manual Search
│   └── medication/
│       └── [id].tsx                  # Add / Edit Medication
├── src/
│   ├── stores/
│   │   ├── cabinetStore.ts
│   │   ├── scheduleStore.ts
│   │   └── appStore.ts
│   ├── hooks/
│   │   ├── usePubChemQuery.ts
│   │   ├── useChEMBLQuery.ts
│   │   ├── useWikidataQuery.ts
│   │   └── useRegionalQuery.ts
│   ├── services/
│   │   ├── pubchem.ts
│   │   ├── chembl.ts
│   │   ├── wikidata.ts
│   │   ├── regional/
│   │   │   ├── index.ts              # Routes to correct source by country
│   │   │   ├── openfda.ts
│   │   │   ├── ema.ts
│   │   │   ├── nhs.ts
│   │   │   ├── india.ts              # Queries bundled SQLite
│   │   │   └── wikidata-fallback.ts
│   │   ├── nlmRxImage.ts
│   │   └── geminiVision.ts
│   ├── scanner/
│   │   ├── mlkitOCR.ts
│   │   ├── ocrToINN.ts               # Token extraction + PubChem INN resolution
│   │   ├── pillIdentifier.ts
│   │   └── identificationPipeline.ts # Orchestrates all fallback steps
│   ├── notifications/
│   │   └── scheduleNotification.ts   # Expo Notifications helper
│   ├── db/
│   │   ├── database.ts               # SQLite init + kv_store + dose_log tables
│   │   └── kvStorage.ts              # Zustand persist storage adapter
│   └── components/
│       ├── DrugInfoCard.tsx
│       ├── DrugInfoCardSkeleton.tsx   # Loading skeleton
│       ├── MedicalDisclaimer.tsx
│       ├── BrandNameSection.tsx
│       ├── DoseCard.tsx
│       └── ScannerFAB.tsx
├── assets/
│   └── india-medicines.db            # Bundled Indian medicine dataset (SQLite)
└── app.config.js                     # EAS secrets injection
```

---

## 9. Build Phases (In Scope)

| Phase | Weeks | Deliverables |
|---|---|---|
| Phase 1 — Core Scanner | 1–4 | EAS dev build setup, expo-camera, ML Kit OCR, OCR-to-INN resolution, NLM RxImage pill ID, Manual Search, PubChem + ChEMBL queries, Drug Info Card UI with skeleton loading, SQLite setup, Medicine Cabinet (save/view), medical disclaimer |
| Phase 2 — Brand Names | 5–6 | Wikidata SPARQL, expo-localization country detection, regional connectors (OpenFDA/EMA/NHS/India bundled), Gemini Flash fallback + user consent prompt, brand name display |
| Phase 3 — Scheduler | 7–9 | Schedule screen, Add/Edit Medication UI with frequency picker, Expo Notifications (all FrequencyTypes), dose history log, History screen, Settings screen |

---

## 10. Error Handling & Edge Cases

| Scenario | Handling |
|---|---|
| OCR finds no text | Advance to NLM RxImage pill ID |
| NLM RxImage returns no match | Offer Manual Search; show Gemini option with consent prompt (Phase 2+) |
| All identification fails | "Could not identify this medicine" screen with Manual Search |
| Drug not found in PubChem/ChEMBL | Show "Information not available" card with Manual Search option |
| Brand name missing for user's country | Show generic name with note: "Brand name may vary in your region" |
| API field empty | Display "Information not available for this medicine" in that section |
| No network connection | Serve React Query cached data; show offline banner if cache is empty |
| Query timeout (10s) | Show "Could not load — tap to retry" in that card section |
| Rate limit hit (429) | Retry after 2s; if still failing, show cached or partial data |
| Notification permission denied | Prompt once at schedule creation; fall back to in-app reminder list only |

---

## 11. Legal & Privacy

- Medical disclaimer shown on every Drug Info Card — non-removable
- App is framed as a **reference tool only** — not a diagnostic tool
- No user PII is collected or stored in Phases 1–3
- Drug data is stored locally only (Expo SQLite) — no remote sync in Phases 1–3
- **Gemini Flash exception:** When the AI fallback is triggered, a camera image is transmitted to Google's servers. This image contains no user PII. Users are shown a one-time opt-in prompt before the first Gemini call: *"To identify this medicine, we need to send an image to Google's AI service. No personal information is included."* Users may decline and fall back to Manual Search.
- SQLite data is **not encrypted** in Phases 1–3 (encryption deferred to Phase 4)
- Future compliance (Phase 4+): GDPR, PDPA, HIPAA considerations apply when cloud sync is introduced


# DO IT PLATFORM — FRONTEND MASTER CONTEXT
# Read this entire prompt before generating any code.
# This is a one-time context setup for the full project.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WHAT IS THIS APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Do It" is a global service marketplace mobile app built in 
React Native (Expo) with TypeScript. It connects:
  - CLIENTS: post jobs, hire providers, pay via wallet
  - PROVIDERS: apply to jobs, complete work, get paid

Supports physical/local AND digital/remote services worldwide.
Both roles use the same app but see different dashboards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework:    React Native with Expo (SDK 51+)
Language:     TypeScript ONLY — never generate .js files
Router:       Expo Router (file-based routing in app/ folder)
Icons:        @expo/vector-icons → Ionicons
Navigation:   expo-router useRouter() and Link
State:        Zustand (global) + useState (local)
HTTP:         Axios via src/services/api.ts
Realtime:     Socket.io via src/services/socketService.ts
Storage:      expo-secure-store (tokens) + MMKV (cache)
Maps:         expo-location + react-native-maps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FOLDER STRUCTURE — ACTIVE PROJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mobile/
├── app/                          ← Expo Router routes (screens live here)
│   ├── (auth)/                   ← Auth screens group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── otp-verify.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (onboarding)/             ← Onboarding screens group
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx           ← carousel (3 slides)
│   │   └── role-select.tsx
│   ├── (client)/                 ← Client dashboard group
│   │   ├── _layout.tsx           ← client bottom tabs
│   │   ├── home.tsx
│   │   ├── post-job.tsx          ← 3-step form in 1 screen
│   │   ├── my-jobs.tsx
│   │   ├── job-detail/[id].tsx
│   │   ├── proposals/[jobId].tsx
│   │   ├── wallet.tsx
│   │   ├── wallet-topup.tsx
│   │   ├── wallet-withdraw.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   ├── (provider)/               ← Provider dashboard group
│   │   ├── _layout.tsx           ← provider bottom tabs
│   │   ├── home.tsx
│   │   ├── browse-jobs.tsx
│   │   ├── job-detail/[id].tsx
│   │   ├── proposals.tsx
│   │   ├── active-job/[id].tsx
│   │   ├── earnings.tsx
│   │   ├── kyc.tsx               ← 4 states in 1 screen
│   │   └── profile.tsx
│   ├── (shared)/                 ← Shared screens (both roles)
│   │   ├── chat/[id].tsx
│   │   ├── public-profile/[id].tsx
│   │   ├── notifications.tsx
│   │   ├── settings.tsx
│   │   ├── raise-dispute/[jobId].tsx
│   │   └── leave-review/[jobId].tsx
│   ├── (help)/                   ← Help & Support (9 screens)
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── faq.tsx
│   │   ├── faq-detail/[id].tsx
│   │   ├── live-chat.tsx         ← pre-chat + active in 1 screen
│   │   ├── tickets.tsx
│   │   ├── new-ticket.tsx
│   │   ├── ticket-detail/[id].tsx
│   │   ├── report.tsx
│   │   └── safety.tsx
│   ├── index.tsx                 ← Splash screen
│   ├── _layout.tsx               ← Root layout
│   └── +not-found.tsx
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx        ← primary reusable button
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx         ← reusable text input
│   │   │   ├── Loader.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── OTPInput.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── MapPreview.tsx
│   │   ├── job/
│   │   │   ├── JobCard.tsx
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── JobStatusBadge.tsx
│   │   │   └── CategoryGrid.tsx
│   │   └── wallet/
│   │       └── TransactionItem.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   ├── useColorScheme.ts
│   │   └── useColorScheme.web.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── ClientTabs.tsx
│   │   └── ProviderTabs.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── jobService.ts
│   │   ├── socketService.ts
│   │   └── walletService.ts
│   ├── theme/
│   │   ├── colors.ts             ← COLOR TOKENS LIVE HERE
│   │   ├── typography.ts
│   │   └── index.ts
│   └── utils/
│       ├── formatCurrency.ts
│       ├── storage.ts
│       └── validators.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## THEME SYSTEM — CRITICAL — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The app supports BOTH light and dark themes.
Theme is determined by the device system setting automatically.
Colors file is at: src/theme/colors.ts

EXACT COLORS (use these values, never different ones):

export const Colors = {
  light: {
    primary:        '#1A9E8F',
    primaryMid:     '#7ABFB8',
    primaryLight:   '#E0F4F2',
    primaryDark:    '#0D7A6E',
    amber:          '#F5A623',
    amberLight:     '#FEF3DC',
    success:        '#27AE60',
    error:          '#E74C3C',
    warning:        '#F39C12',
    background:     '#F0F4F4',
    card:           '#FFFFFF',
    cardBorder:     '#D0E8E6',
    textPrimary:    '#1A1A1A',
    textSecondary:  '#666666',
    textHint:       '#AAAAAA',
    divider:        '#E8EDED',
    navBg:          '#FFFFFF',
    navBorder:      '#D0E8E6',
    inputBg:        '#FFFFFF',
    inputBorder:    '#D0E8E6',
    inputFocus:     '#1A9E8F',
    overlay:        'rgba(0,0,0,0.5)',
  },
  dark: {
    primary:        '#1A9E8F',
    primaryMid:     '#7ABFB8',
    primaryLight:   '#0F3330',
    primaryDark:    '#0F3330',
    amber:          '#F5A623',
    amberLight:     '#2A1F00',
    success:        '#27AE60',
    error:          '#E74C3C',
    warning:        '#F39C12',
    background:     '#0D1F1E',
    card:           '#152E2C',
    cardBorder:     '#1F4A47',
    textPrimary:    '#E8F8F6',
    textSecondary:  '#7ABFB8',
    textHint:       '#4A7A75',
    divider:        '#1F4A47',
    navBg:          '#0A1A19',
    navBorder:      '#1F4A47',
    inputBg:        '#152E2C',
    inputBorder:    '#1F4A47',
    inputFocus:     '#1A9E8F',
    overlay:        'rgba(0,0,0,0.7)',
  },
};

HOW TO USE THEME IN EVERY SCREEN (mandatory pattern):

import { useColorScheme } from 'react-native';
import { Colors } from '@/src/theme/colors';

export default function MyScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  // Use C.background, C.card, C.primary etc everywhere
  // NEVER hardcode any hex color in any screen
  // NEVER use the light color directly if it should change in dark

  const styles = makeStyles(C);
  return ( ... );
}

// Dynamic styles factory at bottom of every file:
const makeStyles = (C: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    card:      { backgroundColor: C.card, borderColor: C.cardBorder, 
                 borderWidth: 0.5, borderRadius: 16, padding: 16 },
    // ... all styles using C.colorName
  });

EXCEPTION — these are SAME in both themes (inline them):
  C.primary    = '#1A9E8F' always (teal buttons, links, active)
  C.amber      = '#F5A623' always (stars, warnings, amber accents)
  C.success    = '#27AE60' always
  C.error      = '#E74C3C' always

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TYPOGRAPHY SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font family: System font (Inter if loaded via expo-font, else System)
fontFamily: 'Inter_400Regular' | 'Inter_500Medium' | 'Inter_700Bold'
Fallback: { fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }

Sizes (use ONLY these):
  displayLarge:  28px / 800   ← wallet balance, big numbers
  h1:            24px / 700   ← screen main titles
  h2:            20px / 700   ← section titles
  h3:            17px / 600   ← card titles
  h4:            15px / 600   ← subsection labels
  body:          14px / 400   ← body text, descriptions
  small:         13px / 400   ← captions, meta info
  micro:         12px / 400   ← timestamps, hints
  tiny:          10px / 500   ← badges, pills

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SPACING & RADIUS SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen horizontal padding:  20px
Section gap:                24px
Card internal padding:      16px
Between elements:           12px
Tight gap:                  8px

Border radius:
  card:        16px
  button:      12px
  input:       10px
  pill:        20px (or 9999)
  small card:  10px
  icon circle: 50% (use borderRadius = size/2)
  avatar:      50%

Button heights:
  primary large:   52px
  primary medium:  44px
  small action:    36px
  icon button:     40px

Input height:   52px
Bottom nav:     60px (with SafeAreaView bottom padding)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## COMPONENT CONVENTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUTTONS — always use src/components/common/Button.tsx:
  

INPUTS — always use src/components/common/Input.tsx:
  

CARDS — always use src/components/common/Card.tsx:
  
    { children }
  

AVATAR — src/components/common/Avatar.tsx:
  

LOADER — src/components/common/Loader.tsx:
   ← full screen centered ActivityIndicator C.primary

STATUS BADGE — src/components/job/JobStatusBadge.tsx:
  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STATUS BADGE COLORS (both themes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

open:        bg C.primaryLight  text C.primary
in_progress: bg C.amberLight    text C.amber
completed:   bg '#E8F8F2'       text C.success   (dark: bg '#0F2E1F')
disputed:    bg '#FDECEA'       text C.error      (dark: bg '#2E1010')
cancelled:   bg C.divider       text C.textHint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## NAVIGATION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always use expo-router:
  import { useRouter, useLocalSearchParams, Link } from 'expo-router';
  const router = useRouter();

Navigate forward:    router.push('/path')
Navigate replace:    router.replace('/path')  ← use after login/logout
Go back:             router.back()
Pass params:         router.push({ pathname: '/path', params: { id } })
Read params:         const { id } = useLocalSearchParams<{ id: string }>();

Bottom tabs defined in:
  app/(client)/_layout.tsx   ← for client role
  app/(provider)/_layout.tsx ← for provider role

After login: replace to /(client)/home OR /(provider)/home based on role
After logout: replace to /(auth)/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SCREEN GENERATION RULES — MANDATORY FOR ALL SCREENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. FILE TYPE: Always .tsx — never .js or .jsx

2. THEME: Every screen MUST have at top:
   const scheme = useColorScheme();
   const C = scheme === 'dark' ? Colors.dark : Colors.light;
   const styles = makeStyles(C);

3. STYLES: makeStyles(C) factory function at bottom of every file.
   NEVER use hardcoded hex colors anywhere in any screen.
   NEVER use StyleSheet.create() without passing C.

4. SAFE AREA: Wrap every screen root in:
   

5. SCROLL: Use ScrollView for content taller than screen.
   Use KeyboardAvoidingView around forms.

6. LISTS: Use FlatList for any list with more than 5 items.
   NEVER map() inside ScrollView for long dynamic lists.

7. LOADING: Show  while fetching. 
   Show ActivityIndicator inside buttons while submitting.

8. ERRORS: Show inline error text below fields (12px C.error).
   Show toast for API errors using react-native-toast-message.

9. EMPTY STATE: Every list screen needs an empty state:
   Centered icon (C.primaryLight circle 80px) + title + subtitle + CTA.

10. IMPORTS: 
    Colors from '@/src/theme/colors'
    Common components from '@/src/components/common/ComponentName'
    Job components from '@/src/components/job/ComponentName'

11. BOTH THEMES VISIBLE: When generating, show light theme as 
    the primary visual but ensure ALL colors reference C. so 
    dark theme works automatically when device is in dark mode.

12. DARK THEME SPECIFIC:
    - Card bg: #152E2C (C.card)
    - Page bg: #0D1F1E (C.background)  
    - Borders: #1F4A47 (C.cardBorder)
    - Text: #E8F8F6 (C.textPrimary)
    - Teal primary buttons stay #1A9E8F in both themes
    - Hero teal cards (wallet balance etc) stay #1A9E8F in both themes
    - Amber stays #F5A623 in both themes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ALL 51 SCREENS — FILE PATHS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONBOARDING:
  app/index.tsx                           ← Splash
  app/(onboarding)/welcome.tsx            ← Carousel (3 slides in 1)
  app/(auth)/register.tsx                 ← Registration form
  app/(auth)/otp-verify.tsx               ← OTP (email+phone in 1)
  app/(onboarding)/role-select.tsx        ← Role selection

AUTH:
  app/(auth)/login.tsx                    ← Login + all states
  app/(auth)/forgot-password.tsx          ← Forgot password
  app/(auth)/reset-password.tsx           ← Reset + success in 1

CLIENT:
  app/(client)/home.tsx                   ← Client dashboard
  app/(client)/post-job.tsx               ← 3-step form in 1 screen
  app/(client)/my-jobs.tsx                ← Jobs list with tabs
  app/(client)/job-detail/[id].tsx        ← Job detail + states
  app/(client)/proposals/[jobId].tsx      ← View proposals
  app/(client)/wallet.tsx                 ← Wallet main
  app/(client)/wallet-topup.tsx           ← Top up
  app/(client)/wallet-withdraw.tsx        ← Withdraw
  app/(client)/messages.tsx               ← Message list
  app/(client)/profile.tsx                ← Client profile

PROVIDER:
  app/(provider)/home.tsx                 ← Provider dashboard
  app/(provider)/browse-jobs.tsx          ← Browse + filter
  app/(provider)/job-detail/[id].tsx      ← Job detail (provider view)
  app/(provider)/proposals.tsx            ← My proposals
  app/(provider)/active-job/[id].tsx      ← Active job + complete
  app/(provider)/earnings.tsx             ← Earnings + chart
  app/(provider)/kyc.tsx                  ← KYC (4 states in 1)
  app/(provider)/profile.tsx              ← Provider profile

SHARED:
  app/(shared)/chat/[id].tsx              ← Chat screen
  app/(shared)/public-profile/[id].tsx    ← Public profile viewer
  app/(shared)/notifications.tsx          ← Notifications
  app/(shared)/settings.tsx               ← Settings
  app/(shared)/raise-dispute/[jobId].tsx  ← Raise dispute
  app/(shared)/leave-review/[jobId].tsx   ← Leave review

HELP & SUPPORT:
  app/(help)/index.tsx                    ← Help home
  app/(help)/faq.tsx                      ← FAQ list
  app/(help)/faq-detail/[id].tsx          ← FAQ article
  app/(help)/live-chat.tsx                ← Live chat (2 states in 1)
  app/(help)/tickets.tsx                  ← My tickets
  app/(help)/new-ticket.tsx               ← New ticket form
  app/(help)/ticket-detail/[id].tsx       ← Ticket thread
  app/(help)/report.tsx                   ← Report issue
  app/(help)/safety.tsx                   ← Safety center

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## HOW TO REQUEST EACH SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After pasting this context, request each screen like this:

  @stitch Build the Login screen for Do It platform.
  File: app/(auth)/login.tsx
  Follow all rules from the master context above.

OR for a specific screen with extra detail:

  @stitch Build the Post a Job screen for Do It platform.
  File: app/(client)/post-job.tsx
  This is a 3-step form in ONE component using useState(step).
  Step 1: Job basics (title, category, type, description, photos)
  Step 2: Location, radius, budget, deadline
  Step 3: Review summary and post button
  Follow all master context rules. Both light and dark theme.

The Stitch MCP will generate the complete .tsx file with:
- Both light and dark theme via makeStyles(C) pattern
- All component states (loading, error, empty, success)
- Proper expo-router navigation
- All imports from correct paths in this project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CONTEXT LOADED. READY TO BUILD.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You now have full awareness of the Do It platform project.
Confirm you have read and understood this context by saying:
"Do It platform context loaded. Ready to build screens."
Then wait for the first screen request.

import React from 'react';
import { IOSDevice } from './components/IOSFrame';
import { BottomNav } from './components/BottomNav';
import { MenuSheet } from './components/MenuSheet';
import { QuoteBubble, MoodBubble } from './components/CoachBubbles';
import { CoachFAB } from './components/CoachFAB';
import { HomeScreen } from './screens/Home';
import { CommunityScreen } from './screens/Community';
import { CoachScreen } from './screens/Coach';
import { RewardsScreen } from './screens/Rewards';
import { DiscoverScreen } from './screens/Discover';
import { KasseScreen } from './screens/Kasse';
import { KasseOnboardingScreen } from './screens/KasseOnboarding';
import { OnboardingScreen } from './screens/Onboarding';
import { ProfileScreen } from './screens/Profile';
import { DemoBlocker } from './components/DemoBlocker';
import { DemoPage } from './components/DemoPage';
import { clearProfile, getProfile, hasProfile } from './lib/profile';

export function App() {
  const [tab, setTab] = React.useState('home');
  // Tab den der User VOR dem Coach offen hatte — damit der Back-Pfeil im
  // Coach genau dahin zurückspringt, nicht stumpf auf Home.
  const [prevTab, setPrevTab] = React.useState('home');
  const [mood, setMood] = React.useState(null);
  // Coach-Bubble-Flow: erst Quote, dann Mood (nach X auf Quote)
  const [quoteOpen, setQuoteOpen] = React.useState(true);
  const [moodOpen, setMoodOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Onboarding-Gate: zeigen wenn noch kein Profil im localStorage
  const [needsOnboarding, setNeedsOnboarding] = React.useState(!hasProfile());

  // Profile-View aus dem Hamburger-Menü
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Chat-Modal (vom Chat-Icon neben „Monatliche Rangliste" geöffnet)
  const [communityOpen, setCommunityOpen] = React.useState(false);

  // Krankenkassen-Onboarding (vom BenefitCard oder Kasse-Tab geöffnet)
  const [kasseOnboardingOpen, setKasseOnboardingOpen] = React.useState(false);

  // „Nicht in der Demo"-Popup. Optional zeigen wir vorher eine Fake-Seite
  // mit dem gegebenen Titel (Skeleton-Inhalt) — damit der Witz landet.
  const [demoBlockerOpen, setDemoBlockerOpen] = React.useState(false);
  const [demoPageTitle, setDemoPageTitle] = React.useState(null);
  const demoTimerRef = React.useRef(null);

  // Wird true wenn das Leistungs-Detail-Sheet in Kasse offen ist.
  // Brauchen wir um den Coach-FAB darunter wegzublenden (anderer Stacking-Context).
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Coach von einem Tab aus aufrufen — merkt sich den Ursprung für Back.
  const openCoach = () => {
    if (tab !== 'coach') setPrevTab(tab);
    setTab('coach');
  };
  const backFromCoach = () => setTab(prevTab || 'home');

  // Generischer Demo-Trip: kurz auf eine Fake-Seite leiten, dann Blocker drüber.
  const visitDemoPage = (title) => {
    setMenuOpen(false);
    setDemoPageTitle(title);
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    demoTimerRef.current = setTimeout(() => setDemoBlockerOpen(true), 500);
  };

  const closeDemoFlow = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    setDemoBlockerOpen(false);
    setCommunityOpen(false);
    setDemoPageTitle(null);
  };

  React.useEffect(() => () => clearTimeout(demoTimerRef.current), []);

  // Aktuelles Profil — wird neu gelesen wenn sich was ändert
  const [profile, setProfile] = React.useState(() => getProfile());
  const refreshProfile = () => setProfile(getProfile());

  const kasseComplete = Boolean(profile?.kasse?.complete);

  const logout = () => {
    clearProfile();
    setMenuOpen(false);
    setProfileOpen(false);
    setCommunityOpen(false);
    setKasseOnboardingOpen(false);
    setDemoBlockerOpen(false);
    setDemoPageTitle(null);
    setProfile(null);
    setTab('home');
    setQuoteOpen(true);
    setMoodOpen(false);
    setMood(null);
    setNeedsOnboarding(true);
  };

  const openKasseOnboarding = () => {
    setKasseOnboardingOpen(true);
  };

  const openProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  return (
    <IOSDevice width={402} height={874}>
      <HomeScreen
        onMenu={() => setMenuOpen(true)}
        showBenefitCard={!kasseComplete}
        onBenefitClick={openKasseOnboarding}
        onOpenChat={() => {
          // Erst auf die Community-Seite leiten — kleiner Moment, damit man
          // sie sieht — dann poppt der „Nicht in der Demo"-Stempel rein.
          setCommunityOpen(true);
          if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
          demoTimerRef.current = setTimeout(() => setDemoBlockerOpen(true), 500);
        }}
        onDemoPage={visitDemoPage}
        profile={profile}
        mood={mood}
      />

      {tab !== 'coach' && !detailOpen && quoteOpen && (
        <QuoteBubble onClose={() => {
          // X auf Quote → Quote weg, Mood-Bubble erscheint im gleichen Slot
          setQuoteOpen(false);
          setMoodOpen(true);
        }} />
      )}
      {tab !== 'coach' && !detailOpen && !quoteOpen && moodOpen && (
        <MoodBubble
          value={mood}
          onPick={setMood}
          onClose={() => setMoodOpen(false)}
        />
      )}
      <BottomNav tab={tab} onChange={setTab} />
      {tab !== 'coach' && !detailOpen && <CoachFAB onClick={openCoach} />}
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={logout}
        onProfile={openProfile}
        onDemoPage={visitDemoPage}
        profile={profile}
      />
      {tab === 'kasse' && (
        <KasseScreen
          onMenu={() => setMenuOpen(true)}
          profile={profile}
          onStartOnboarding={openKasseOnboarding}
          onDetailOpenChange={setDetailOpen}
        />
      )}
      {tab === 'coach' && (
        <CoachScreen
          onBack={backFromCoach}
          profile={profile}
          onStartKasseOnboarding={openKasseOnboarding}
        />
      )}
      {tab === 'rewards' && (
        <RewardsScreen onMenu={() => setMenuOpen(true)} />
      )}
      {tab === 'discover' && (
        <DiscoverScreen onMenu={() => setMenuOpen(true)} />
      )}

      {communityOpen && (
        <CommunityScreen onBack={() => setCommunityOpen(false)} />
      )}

      {demoPageTitle && (
        <DemoPage title={demoPageTitle} onBack={closeDemoFlow} />
      )}

      {kasseOnboardingOpen && (
        <KasseOnboardingScreen
          onClose={() => setKasseOnboardingOpen(false)}
          onDone={() => {
            setKasseOnboardingOpen(false);
            refreshProfile();
            setTab('kasse');
          }}
        />
      )}

      {profileOpen && (
        <ProfileScreen
          onClose={() => {
            setProfileOpen(false);
            refreshProfile();
          }}
          onDemoPage={visitDemoPage}
        />
      )}

      {needsOnboarding && (
        <OnboardingScreen onDone={() => {
          setNeedsOnboarding(false);
          refreshProfile();
        }} />
      )}

      <DemoBlocker open={demoBlockerOpen} onClose={closeDemoFlow} />
    </IOSDevice>
  );
}

// Main app file. This is where the auth, pet state, sounds, saving, and routes all meet.
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import StatsPanel from "./components/StatsPanel";
import PetScene from "./components/PetScene";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  createDefaultPet,
  deletePetById,
  deletePetForUser,
  getFirebaseMessage,
  listenToAuthChanges,
  listenToPet,
  listenToUserProfile,
  loadPetForUser,
  loadUserProfile,
  registerUser,
  savePetForUser,
  signInUser,
  signOutUser,
} from "./utils/firebase";

const AdminPanel = lazy(() => import("./components/AdminPanel"));

const petColors = ["#d8ab64", "#ff9fc2", "#8ad8ff", "#9fd46d", "#f6d96b"];
const hungryThreshold = 100;
const tooHungryToPlayThreshold = 10;
const saveIntervalMs = 5 * 60 * 1000;
const liveHappinessTickMs = 10 * 1000;
const liveHappinessDrop = 10;
const liveHungerTickMs = 20 * 1000;
const liveHungerDrop = 10;
const offlineStatWindowMs = 30 * 60 * 1000;
const offlineStatDrop = 5;
const actionFlashMs = 900;
const toyVisibleMs = actionFlashMs * 2;
const musicVolume = 0.14;
const soundVolume = 0.4;
const shortDogSoundMs = 5 * 1000;
const idleDogSoundIntervalMs = 12 * 1000;
const puppySoundPath = "/sounds/yoursperfectguy-cute-puppy-sound-effect-sfx-1-336356.mp3";
const toySoundPath = "/sounds/freesound_community-dog-toy-5987.mp3";
const eatingSoundPath = "/sounds/freesound_community-dog-eating-74505.mp3";
const pantingSoundPath = "/sounds/fnx_sound-animated-dog-panting-287307.mp3";
const whiningSoundPath = "/sounds/freesound_community-whining-dog-6110.mp3";
const musicPath =
  "/sounds/openmindaudio-good-vibes-podcast-introoutro-warm-positive-closing-theme-469100.mp3";

// This keeps the pet face linked to the happiness meter.
function getPetExpression(pet) {
  if (pet.happiness <= 0) {
    return "depressed";
  }

  if (pet.happiness >= 95) {
    return "jubilant";
  }

  if (pet.happiness >= 75) {
    return "happy";
  }

  if (pet.happiness >= 40) {
    return "neutral";
  }

  return "sad";
}

// This makes sure every pet has the fields the app expects.
function normalizePetState(pet) {
  const defaultPet = createDefaultPet("Guest");
  const nextPet = {
    ...defaultPet,
    ...pet,
  };

  nextPet.level = nextPet.level ?? 1;
  nextPet.feedExp = nextPet.feedExp ?? 0;
  nextPet.playExp = nextPet.playExp ?? 0;
  nextPet.goalCount = nextPet.goalCount ?? 5;
  nextPet.exp = nextPet.exp ?? nextPet.feedExp + nextPet.playExp;
  nextPet.expGoal = nextPet.expGoal ?? nextPet.goalCount * 2;
  nextPet.lastFullAt = nextPet.lastFullAt ?? 0;
  nextPet.lastStateAt = nextPet.lastStateAt ?? Date.now();
  nextPet.lastSavedAt = nextPet.lastSavedAt ?? nextPet.lastStateAt;

  return nextPet;
}

// This applies offline stat loss when the user comes back later.
function hydratePetState(pet) {
  const nextPet = normalizePetState(pet);
  const now = Date.now();
  const offlineLoss = nextPet.lastSavedAt
    ? Math.floor((now - nextPet.lastSavedAt) / offlineStatWindowMs) * offlineStatDrop
    : 0;

  nextPet.hunger = Math.max(0, Math.min(100, nextPet.hunger - offlineLoss));
  nextPet.happiness = Math.max(0, Math.min(100, nextPet.happiness - offlineLoss));
  nextPet.toyVisible = false;
  nextPet.exp = nextPet.feedExp + nextPet.playExp;
  nextPet.expGoal = nextPet.goalCount * 2;
  nextPet.expression = getPetExpression(nextPet);

  return nextPet;
}

// This controls which colours unlock at each level.
function getUnlockedColors(level, userRole) {
  if (userRole === "admin" || level >= 5) {
    return petColors;
  }

  if (level >= 4) {
    return petColors.slice(0, 4);
  }

  if (level >= 2) {
    return petColors.slice(0, 3);
  }

  return petColors.slice(0, 2);
}

// This checks if both play and feed progress are enough for a level up.
function applyLevelProgress(pet) {
  const nextPet = normalizePetState(pet);

  nextPet.exp = nextPet.feedExp + nextPet.playExp;
  nextPet.expGoal = nextPet.goalCount * 2;

  if (nextPet.feedExp < nextPet.goalCount || nextPet.playExp < nextPet.goalCount) {
    return { pet: nextPet, leveledUp: false };
  }

  const nextGoal = Math.ceil(nextPet.goalCount * 1.5);

  nextPet.level += 1;
  nextPet.feedExp = 0;
  nextPet.playExp = 0;
  nextPet.exp = 0;
  nextPet.goalCount = nextGoal;
  nextPet.expGoal = nextGoal * 2;

  return { pet: nextPet, leveledUp: true };
}

// Main React component for the full website.
function App() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [signedInUser, setSignedInUser] = useState(null);
  const [pet, setPet] = useState(normalizePetState(createDefaultPet("Guest")));
  const [recentAction, setRecentAction] = useState("");
  const [statusMessage, setStatusMessage] = useState("Not signed in.");
  const [busy, setBusy] = useState(true);
  const [userRole, setUserRole] = useState("guest");
  const [view, setView] = useState("front");
  const [lightMode, setLightMode] = useState("bright");
  const [musicMuted, setMusicMuted] = useState(false);
  const [dogSoundsMuted, setDogSoundsMuted] = useState(false);
  const petRef = useRef(normalizePetState(createDefaultPet("Guest")));
  const petListenerRef = useRef(null);
  const profileListenerRef = useRef(null);
  const musicRef = useRef(null);
  const puppySoundRef = useRef(null);
  const toySoundRef = useRef(null);
  const eatingSoundRef = useRef(null);
  const pantingSoundRef = useRef(null);
  const whiningSoundRef = useRef(null);
  const lastInteractionAtRef = useRef(Date.now());
  const lastIdleSoundAtRef = useRef(0);
  const activeDogSoundRef = useRef(null);
  const dogSoundTimerRef = useRef(null);
  const musicMutedRef = useRef(false);
  const dogSoundsMutedRef = useRef(false);

  const unlockedColors = getUnlockedColors(pet.level, userRole);

  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  useEffect(() => {
    musicMutedRef.current = musicMuted;
  }, [musicMuted]);

  useEffect(() => {
    dogSoundsMutedRef.current = dogSoundsMuted;
  }, [dogSoundsMuted]);

  useEffect(() => {
    // Load the audio files once when the app starts.
    musicRef.current = new Audio(musicPath);
    musicRef.current.loop = true;
    musicRef.current.volume = musicVolume;

    puppySoundRef.current = new Audio(puppySoundPath);
    toySoundRef.current = new Audio(toySoundPath);
    eatingSoundRef.current = new Audio(eatingSoundPath);
    pantingSoundRef.current = new Audio(pantingSoundPath);
    whiningSoundRef.current = new Audio(whiningSoundPath);

    return () => {
      if (dogSoundTimerRef.current) {
        window.clearTimeout(dogSoundTimerRef.current);
      }

      [
        musicRef.current,
        puppySoundRef.current,
        toySoundRef.current,
        eatingSoundRef.current,
        pantingSoundRef.current,
        whiningSoundRef.current,
      ].forEach((audio) => {
        if (!audio) {
          return;
        }

        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  useEffect(() => {
    // Keep the music button in sync with the actual music audio.
    const music = musicRef.current;

    if (!music) {
      return;
    }

    if (musicMuted) {
      music.pause();
      return;
    }

    music.volume = musicVolume;
    music.play().catch(() => {});
  }, [musicMuted]);

  useEffect(() => {
    // If dog sounds are muted, stop any sound that is already playing.
    if (!dogSoundsMuted) {
      return;
    }

    stopDogSound();
  }, [dogSoundsMuted]);

  useEffect(() => {
    // This handles the idle dog sounds when the user leaves the pet alone.
    const timer = window.setInterval(() => {
      if (dogSoundsMuted) {
        return;
      }

      const now = Date.now();
      const isSad = petRef.current.expression === "sad" || petRef.current.expression === "depressed";

      if (
        now - lastInteractionAtRef.current < idleDogSoundIntervalMs ||
        now - lastIdleSoundAtRef.current < idleDogSoundIntervalMs
      ) {
        return;
      }

      if (isSad) {
        playDogSound(whiningSoundRef, 0.4, shortDogSoundMs);
      } else {
        playDogSound(
          Math.random() < 0.5 ? whiningSoundRef : pantingSoundRef,
          0.35,
          shortDogSoundMs,
        );
      }

      lastIdleSoundAtRef.current = now;
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dogSoundsMuted]);

  useEffect(() => {
    // This listens for Firebase sign in/out and loads the saved user + pet data.
    const unsubscribe = listenToAuthChanges(async (user) => {
      if (petListenerRef.current) {
        petListenerRef.current();
        petListenerRef.current = null;
      }

      if (profileListenerRef.current) {
        profileListenerRef.current();
        profileListenerRef.current = null;
      }

      setBusy(true);
      setSignedInUser(user);
      setRecentAction("");

      if (!user) {
        const guestPet = normalizePetState(createDefaultPet("Guest"));

        setPet(guestPet);
        petRef.current = guestPet;
        setPasswordInput("");
        setUserRole("guest");
        setStatusMessage("Not signed in.");
        setBusy(false);
        return;
      }

      try {
        const savedProfile = await loadUserProfile(user);
        const savedPet = hydratePetState(await loadPetForUser(user));

        setPet(savedPet);
        petRef.current = savedPet;
        setEmailInput(user.email || "");
        setPasswordInput("");
        setUserRole(savedProfile.role || "user");
        setStatusMessage(`Signed in as ${user.email}`);

        profileListenerRef.current = listenToUserProfile(
          user,
          (profile) => {
            setUserRole(profile.role || "user");
          },
          (error) => {
            setStatusMessage(getFirebaseMessage(error));
          },
        );

        petListenerRef.current = listenToPet(
          user,
          (nextPet) => {
            const hydratedPet = normalizePetState(nextPet);

            setPet(hydratedPet);
            petRef.current = hydratedPet;
            setBusy(false);
          },
          (error) => {
            setStatusMessage(getFirebaseMessage(error));
            setBusy(false);
          },
        );
      } catch (error) {
        const fallbackPet = normalizePetState(createDefaultPet(user.email || "Player"));

        setPet(fallbackPet);
        petRef.current = fallbackPet;
        setUserRole("user");
        setStatusMessage(getFirebaseMessage(error));
        setBusy(false);
      }
    });

    return () => {
      unsubscribe();

      if (petListenerRef.current) {
        petListenerRef.current();
      }

      if (profileListenerRef.current) {
        profileListenerRef.current();
      }
    };
  }, []);

  useEffect(() => {
    // This clears short action reactions like feed, toy, or pet.
    if (!recentAction) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRecentAction("");
      setPet((currentPet) => {
        const nextPet = {
          ...currentPet,
          expression: getPetExpression(currentPet),
        };

        petRef.current = nextPet;
        return nextPet;
      });
    }, actionFlashMs);

    return () => window.clearTimeout(timer);
  }, [recentAction]);

  useEffect(() => {
    // This hides the toy again after a short time.
    if (!pet.toyVisible) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPet((currentPet) => {
        if (!currentPet.toyVisible) {
          return currentPet;
        }

        const nextPet = {
          ...currentPet,
          toyVisible: false,
        };

        petRef.current = nextPet;
        return nextPet;
      });
    }, toyVisibleMs);

    return () => window.clearTimeout(timer);
  }, [pet.toyVisible]);

  useEffect(() => {
    // Happiness slowly drops while the app is open.
    const timer = window.setInterval(() => {
      setPet((currentPet) => {
        const nextPet = {
          ...currentPet,
          happiness: Math.max(0, currentPet.happiness - liveHappinessDrop),
        };

        nextPet.expression = getPetExpression(nextPet);
        petRef.current = nextPet;
        return nextPet;
      });
    }, liveHappinessTickMs);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Hunger also drops over time while the app is open.
    const timer = window.setInterval(() => {
      setPet((currentPet) => {
        const nextPet = {
          ...currentPet,
          hunger: Math.max(0, currentPet.hunger - liveHungerDrop),
        };

        nextPet.expression = getPetExpression(nextPet);
        petRef.current = nextPet;
        return nextPet;
      });
    }, liveHungerTickMs);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Autosave to Firestore every few minutes for persistence.
    if (!signedInUser) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      const snapshotPet = normalizePetState({
        ...petRef.current,
        lastStateAt: now,
        lastSavedAt: now,
      });

      setPet(snapshotPet);
      petRef.current = snapshotPet;

      savePetForUser(signedInUser, snapshotPet).catch((error) => {
        setStatusMessage(getFirebaseMessage(error));
      });
    }, saveIntervalMs);

    return () => window.clearInterval(timer);
  }, [signedInUser]);

  useEffect(() => {
    // Space is a quick keyboard interaction for the pet.
    function handleKeyDown(event) {
      if (event.repeat) {
        return;
      }

      if (document.activeElement?.tagName === "INPUT") {
        return;
      }

      if (event.code !== "Space") {
        return;
      }

      event.preventDefault();
      registerInteraction();
      persistPet(
        {
          ...petRef.current,
          happiness: Math.min(100, petRef.current.happiness + 5),
        },
        "pet",
        "Pet enjoyed the attention.",
      );
      playDogSound(puppySoundRef, soundVolume, shortDogSoundMs);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [signedInUser]);

  function startMusic() {
    // Start the background music if the user has not muted it.
    const music = musicRef.current;

    if (!music || musicMutedRef.current) {
      return;
    }

    music.volume = musicVolume;
    music.play().catch(() => {});
  }

  function stopDogSound() {
    // Stop the current dog/effect sound so sounds do not stack.
    if (dogSoundTimerRef.current) {
      window.clearTimeout(dogSoundTimerRef.current);
      dogSoundTimerRef.current = null;
    }

    if (!activeDogSoundRef.current) {
      return;
    }

    activeDogSoundRef.current.pause();
    activeDogSoundRef.current.currentTime = 0;
    activeDogSoundRef.current = null;
  }

  function playDogSound(soundRef, volume = soundVolume, durationMs = shortDogSoundMs) {
    // Play one short dog/effect sound and cut it off after the chosen time.
    if (dogSoundsMutedRef.current || !soundRef.current) {
      return;
    }

    stopDogSound();

    soundRef.current.pause();
    soundRef.current.currentTime = 0;
    soundRef.current.volume = volume;
    soundRef.current.play().catch(() => {});
    activeDogSoundRef.current = soundRef.current;

    if (durationMs > 0) {
      dogSoundTimerRef.current = window.setTimeout(() => {
        if (activeDogSoundRef.current === soundRef.current) {
          stopDogSound();
        }
      }, durationMs);
    }
  }

  function registerInteraction() {
    // Track user activity so idle sounds know when to wait.
    lastInteractionAtRef.current = Date.now();
    startMusic();
  }

  function persistPet(nextPet, nextAction = "", nextMessage = "", saveNow = true) {
    // This is the main save helper for pet changes.
    const now = Date.now();
    const preparedPet = normalizePetState({
      ...nextPet,
      lastStateAt: now,
      lastSavedAt: saveNow ? now : nextPet.lastSavedAt,
    });
    preparedPet.expression = getPetExpression(preparedPet);

    setPet(preparedPet);
    petRef.current = preparedPet;

    if (nextAction) {
      setRecentAction(nextAction);
    }

    if (nextMessage) {
      setStatusMessage(nextMessage);
    }

    if (signedInUser && saveNow) {
      savePetForUser(signedInUser, preparedPet).catch((error) => {
        setStatusMessage(getFirebaseMessage(error));
      });
    }
  }

  function handleSave() {
    // Manual save button.
    if (!signedInUser) {
      setStatusMessage("Sign in first to save.");
      return;
    }

    registerInteraction();
    persistPet({ ...petRef.current }, "", "Saved to Firebase.");
  }

  async function handleRegister() {
    // Create a Firebase auth account.
    const email = emailInput.trim();

    if (!email || !passwordInput) {
      setStatusMessage("Enter email and password.");
      return;
    }

    registerInteraction();
    setBusy(true);
    setStatusMessage("Creating account...");

    try {
      await registerUser(email, passwordInput);
    } catch (error) {
      setBusy(false);
      setStatusMessage(getFirebaseMessage(error));
    }
  }

  async function handleSignIn() {
    // Sign in with Firebase auth.
    const email = emailInput.trim();

    if (!email || !passwordInput) {
      setStatusMessage("Enter email and password.");
      return;
    }

    registerInteraction();
    setBusy(true);
    setStatusMessage("Signing in...");

    try {
      await signInUser(email, passwordInput);
    } catch (error) {
      setBusy(false);
      setStatusMessage(getFirebaseMessage(error));
    }
  }

  async function handleSignOut() {
    // Save once more, then sign out.
    registerInteraction();

    if (signedInUser) {
      const now = Date.now();
      const snapshotPet = normalizePetState({
        ...petRef.current,
        lastStateAt: now,
        lastSavedAt: now,
      });

      try {
        await savePetForUser(signedInUser, snapshotPet);
      } catch {
        // Ignore sign-out save failure and continue to sign out.
      }
    }

    setBusy(true);
    setStatusMessage("Signing out...");

    try {
      await signOutUser();
    } catch (error) {
      setBusy(false);
      setStatusMessage(getFirebaseMessage(error));
    }
  }

  async function handleDeleteSave(targetUserId, targetLabel = "") {
    // Admin can delete one saved pet at a time from Firestore.
    if (!signedInUser && !targetUserId) {
      return;
    }

    setStatusMessage("Deleting Firestore save...");

    try {
      if (targetUserId) {
        await deletePetById(targetUserId);
        setStatusMessage(`Deleted save for ${targetLabel || targetUserId}.`);
        return;
      }

      await deletePetForUser(signedInUser);
      setStatusMessage("Deleted your Firestore save.");
    } catch (error) {
      setStatusMessage(getFirebaseMessage(error));
    }
  }

  function handleToyClick() {
    // Playing with the toy raises happiness and play EXP.
    const currentPet = petRef.current;
    registerInteraction();

    if (currentPet.hunger <= tooHungryToPlayThreshold) {
      setStatusMessage("Pet is too hungry to play. Feed it first.");
      return;
    }

    const gainsExp = currentPet.happiness < 100;
    const nextPet = {
      ...currentPet,
      toyVisible: true,
      hunger: Math.max(0, currentPet.hunger - 10),
      happiness: Math.min(100, currentPet.happiness + 12),
    };

    if (gainsExp) {
      nextPet.playExp += 1;
    }

    const levelResult = applyLevelProgress(nextPet);
    const message = levelResult.leveledUp
      ? `Level up! You are now level ${levelResult.pet.level}.`
      : gainsExp
        ? "Pet enjoyed playing."
        : "Pet played, but happiness is already full so no EXP was earned.";

    persistPet(levelResult.pet, "toy", message);
    playDogSound(toySoundRef, soundVolume, actionFlashMs);
  }

  function handleFeedClick() {
    // Feeding only changes hunger and feed EXP.
    const currentPet = petRef.current;
    registerInteraction();

    if (currentPet.hunger >= hungryThreshold) {
      setStatusMessage("Pet is already full.");
      return;
    }

    const nextHunger = Math.min(100, currentPet.hunger + 25);
    const nextPet = {
      ...currentPet,
      hunger: nextHunger,
      feedExp: currentPet.feedExp + 1,
      lastFullAt: nextHunger >= 100 ? Date.now() : currentPet.lastFullAt,
    };

    const levelResult = applyLevelProgress(nextPet);
    const message = levelResult.leveledUp
      ? `Level up! You are now level ${levelResult.pet.level}.`
      : nextHunger >= 100
        ? "Pet is full now."
        : "Pet has eaten.";

    persistPet(levelResult.pet, "feed", message);
    playDogSound(eatingSoundRef, soundVolume, actionFlashMs);
  }

  function handleColourClick() {
    // Cycle through the colours the player has unlocked.
    registerInteraction();
    persistPet(
      {
        ...petRef.current,
        petColor:
          unlockedColors[
            (unlockedColors.indexOf(petRef.current.petColor) + 1 + unlockedColors.length) %
              unlockedColors.length
          ],
      },
      "",
      `Colours unlocked: ${unlockedColors.length}/${petColors.length}.`,
    );
  }

  function handlePetClick() {
    // Clicking the pet is a simple extra interaction.
    registerInteraction();
    persistPet(
      {
        ...petRef.current,
        happiness: Math.min(100, petRef.current.happiness + 5),
      },
      "pet",
      "Pet enjoyed the attention.",
    );
    playDogSound(puppySoundRef, soundVolume, shortDogSoundMs);
  }

  function handleSceneWheel() {
    // This counts as a small scene interaction for the assignment.
    registerInteraction();
    setRecentAction("pet");
    setStatusMessage("Camera moved. Pet reacted.");
  }

  function handleToggleLight() {
    // Simple adjustable lighting with two modes.
    registerInteraction();
    setLightMode((currentMode) => (currentMode === "bright" ? "soft" : "bright"));
  }

  function handleToggleMusic() {
    // Mute or unmute the background music.
    lastInteractionAtRef.current = Date.now();
    setMusicMuted((currentState) => !currentState);
  }

  function handleToggleDogSounds() {
    // Mute or unmute the dog and action sounds.
    lastInteractionAtRef.current = Date.now();
    setDogSoundsMuted((currentState) => !currentState);
  }

  function handleViewChange(nextView) {
    // Change camera view and let the camera animate to it.
    registerInteraction();
    setView(nextView);
  }

  function renderPanelFallback(text) {
    // Small loading panel used for lazy loaded pages.
    return (
      <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-5 text-sm font-bold text-zinc-900 shadow-[0_6px_0_#44202a]">
        {text}
      </section>
    );
  }

  function renderHomePage() {
    // Home page = 3D scene on one side and UI panels on the other.
    return (
      <main className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <PetScene
          lightMode={lightMode}
          onPetClick={handlePetClick}
          onSceneWheel={handleSceneWheel}
          pet={pet}
          recentAction={recentAction}
          view={view}
        />

        <div className="grid gap-4">
          <ControlPanel
            activeView={view}
            lightMode={lightMode}
            onColourClick={handleColourClick}
            onFeedClick={handleFeedClick}
            onToggleLight={handleToggleLight}
            onToyClick={handleToyClick}
            onViewChange={handleViewChange}
          />
          <StatsPanel
            pet={pet}
            signedInUser={signedInUser?.email || ""}
            unlockedColorCount={unlockedColors.length}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffb5c4] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 md:px-6">
        <Header
          busy={busy}
          dogSoundsMuted={dogSoundsMuted}
          emailInput={emailInput}
          musicMuted={musicMuted}
          onEmailChange={setEmailInput}
          onPasswordChange={setPasswordInput}
          onRegister={handleRegister}
          onSave={handleSave}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onToggleDogSounds={handleToggleDogSounds}
          onToggleMusic={handleToggleMusic}
          passwordInput={passwordInput}
          signedInUser={signedInUser?.email || ""}
          statusMessage={statusMessage}
          userRole={userRole}
        />

        <Routes>
          <Route element={renderHomePage()} path="/" />
          <Route
            element={(
              <div className="mb-4">
                <ProtectedRoute
                  busy={busy}
                  requireAdmin
                  signedInUser={signedInUser}
                  userRole={userRole}
                >
                  <Suspense fallback={renderPanelFallback("Loading admin page...")}>
                    <AdminPanel
                      onDeleteSave={handleDeleteSave}
                      signedInUser={signedInUser?.email || ""}
                      userRole={userRole}
                    />
                  </Suspense>
                </ProtectedRoute>
              </div>
            )}
            path="/admin"
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;

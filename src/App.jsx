import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel";
import StatsPanel from "./components/StatsPanel";
import PetScene from "./components/PetScene";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  createDefaultPet,
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

function getPetExpression(pet) {
  if (pet.hunger < 35 || pet.happiness < 35) {
    return "sad";
  }

  return "neutral";
}

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
  const petRef = useRef(normalizePetState(createDefaultPet("Guest")));
  const petListenerRef = useRef(null);
  const profileListenerRef = useRef(null);

  const unlockedColors = getUnlockedColors(pet.level, userRole);

  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  useEffect(() => {
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
      setRecentAction("pet");
      setStatusMessage("Pet reacted.");
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function persistPet(nextPet, nextAction = "", nextMessage = "", saveNow = true) {
    const now = Date.now();
    const preparedPet = normalizePetState({
      ...nextPet,
      lastStateAt: now,
      lastSavedAt: saveNow ? now : nextPet.lastSavedAt,
    });

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
    if (!signedInUser) {
      setStatusMessage("Sign in first to save.");
      return;
    }

    persistPet({ ...petRef.current }, "", "Saved to Firebase.");
  }

  async function handleRegister() {
    const email = emailInput.trim();

    if (!email || !passwordInput) {
      setStatusMessage("Enter email and password.");
      return;
    }

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
    const email = emailInput.trim();

    if (!email || !passwordInput) {
      setStatusMessage("Enter email and password.");
      return;
    }

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

  async function handleDeleteSave() {
    if (!signedInUser) {
      return;
    }

    setStatusMessage("Deleting Firestore save...");

    try {
      await deletePetForUser(signedInUser);
    } catch (error) {
      setStatusMessage(getFirebaseMessage(error));
    }
  }

  function handleToyClick() {
    const currentPet = petRef.current;

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
      expression: "happy",
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
  }

  function handleFeedClick() {
    const currentPet = petRef.current;

    if (currentPet.hunger >= hungryThreshold) {
      setStatusMessage("Pet is already full.");
      return;
    }

    const nextHunger = Math.min(100, currentPet.hunger + 25);
    const nextPet = {
      ...currentPet,
      hunger: nextHunger,
      expression: "happy",
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
  }

  function handleColourClick() {
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
    persistPet(
      {
        ...petRef.current,
        happiness: Math.min(100, petRef.current.happiness + 4),
        expression: "happy",
      },
      "pet",
    );
  }

  function handleSceneWheel() {
    setRecentAction("pet");
    setStatusMessage("Camera moved. Pet reacted.");
  }

  function renderPanelFallback(text) {
    return (
      <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-5 text-sm font-bold text-zinc-900 shadow-[0_6px_0_#44202a]">
        {text}
      </section>
    );
  }

  function renderHomePage() {
    return (
      <main className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Suspense fallback={renderPanelFallback("Loading 3D scene...")}>
          <PetScene
            onPetClick={handlePetClick}
            onSceneWheel={handleSceneWheel}
            pet={pet}
            recentAction={recentAction}
            view={view}
          />
        </Suspense>

        <div className="grid gap-4">
          <ControlPanel
            activeView={view}
            onColourClick={handleColourClick}
            onFeedClick={handleFeedClick}
            onToyClick={handleToyClick}
            onViewChange={setView}
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
        emailInput={emailInput}
        onEmailChange={setEmailInput}
        onPasswordChange={setPasswordInput}
        onRegister={handleRegister}
        onSave={handleSave}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        passwordInput={passwordInput}
        signedInUser={signedInUser?.email || ""}
        statusMessage={statusMessage}
        userRole={userRole}
      />

      <Routes>
        <Route element={renderHomePage()} path="/" />
        <Route
          element={(
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
          )}
          path="/admin"
        />
      </Routes>
      </div>
    </div>
  );
}

export default App;

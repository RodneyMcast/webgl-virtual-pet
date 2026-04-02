// Firebase helper file. All auth and Firestore reads/writes are kept here.
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGyFkF6Twz7hLAmAL81AC6yvf_cpkXkPQ",
  authDomain: "webgl-rodney.firebaseapp.com",
  projectId: "webgl-rodney",
  storageBucket: "webgl-rodney.firebasestorage.app",
  messagingSenderId: "929550952295",
  appId: "1:929550952295:web:b6ecdfe9fb320ddd12f1c2",
  measurementId: "G-651DWZ7GCC",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default pet used for new users or fallback loading.
export function createDefaultPet(userName = "Guest") {
  const label = userName.split("@")[0] || userName;
  const now = Date.now();

  return {
    petName: `${label}'s Blob`,
    petColor: "#d8ab64",
    happiness: 60,
    hunger: 65,
    expression: "neutral",
    toyVisible: false,
    level: 1,
    feedExp: 0,
    playExp: 0,
    exp: 0,
    expGoal: 10,
    goalCount: 5,
    lastFullAt: 0,
    lastStateAt: now,
    lastSavedAt: now,
  };
}

// Every user gets a Firestore profile with a role.
export function createDefaultUserProfile(user) {
  const now = Date.now();

  return {
    uid: user.uid,
    email: user.email || "",
    role: "user",
    createdAt: now,
    updatedAt: now,
  };
}

// Listen for login/logout changes from Firebase Auth.
export function listenToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

// Create a new Firebase auth account.
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Sign in an existing Firebase auth account.
export function signInUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign the current user out.
export function signOutUser() {
  return signOut(auth);
}

// Load the Firestore profile, or create it if it does not exist yet.
export async function loadUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }

  const defaultProfile = createDefaultUserProfile(user);

  await setDoc(userRef, defaultProfile);

  return defaultProfile;
}

// Real-time listener for the user's role/profile document.
export function listenToUserProfile(user, callback, onError) {
  const userRef = doc(db, "users", user.uid);

  return onSnapshot(
    userRef,
    (userSnapshot) => {
      if (userSnapshot.exists()) {
        callback(userSnapshot.data());
        return;
      }

      callback(createDefaultUserProfile(user));
    },
    onError,
  );
}

// Load the pet save, or create a default one for first-time users.
export async function loadPetForUser(user) {
  const petRef = doc(db, "pets", user.uid);
  const petSnapshot = await getDoc(petRef);

  if (petSnapshot.exists()) {
    const data = petSnapshot.data();
    return data.pet || createDefaultPet(user.email || "Player");
  }

  const defaultPet = createDefaultPet(user.email || "Player");

  await setDoc(petRef, {
    uid: user.uid,
    email: user.email || "",
    pet: defaultPet,
    updatedAt: Date.now(),
  });

  return defaultPet;
}

// Real-time listener for the signed-in user's pet data.
export function listenToPet(user, callback, onError) {
  const petRef = doc(db, "pets", user.uid);

  return onSnapshot(
    petRef,
    (petSnapshot) => {
      if (petSnapshot.exists()) {
        const data = petSnapshot.data();
        callback(data.pet || createDefaultPet(user.email || "Player"), true);
        return;
      }

      callback(createDefaultPet(user.email || "Player"), false);
    },
    onError,
  );
}

// Admin uses this to read all saved pets from Firestore.
export function listenToAllPets(callback, onError) {
  const petsRef = collection(db, "pets");

  return onSnapshot(
    petsRef,
    (petSnapshot) => {
      const pets = petSnapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .sort((firstPet, secondPet) => (secondPet.updatedAt || 0) - (firstPet.updatedAt || 0));

      callback(pets);
    },
    onError,
  );
}

// Save the current pet state back into Firestore.
export function savePetForUser(user, pet) {
  const petRef = doc(db, "pets", user.uid);

  return setDoc(
    petRef,
    {
      uid: user.uid,
      email: user.email || "",
      pet,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

// Delete the signed-in user's own pet save.
export function deletePetForUser(user) {
  return deleteDoc(doc(db, "pets", user.uid));
}

// Admin helper to delete one saved pet by uid.
export function deletePetById(userId) {
  return deleteDoc(doc(db, "pets", userId));
}

// Turn Firebase errors into shorter UI messages.
export function getFirebaseMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "That email already has an account.";
    case "auth/invalid-email":
      return "Enter a real email address.";
    case "auth/invalid-credential":
      return "Email or password is wrong.";
    case "auth/missing-password":
      return "Enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "firestore/permission-denied":
    case "permission-denied":
      return "Firestore rules are blocking access right now. Deploy firestore.rules to Firebase.";
    default:
      return error.message || "Firebase request failed.";
  }
}

// Admin page. This lets the admin see saved pets and delete one save at a time.
import { useEffect, useState } from "react";
import { getFirebaseMessage, listenToAllPets } from "../utils/firebase";

// This covers the admin / Firestore management part of the assignment.
function AdminPanel({ onDeleteSave, signedInUser, userRole }) {
  const [petSaves, setPetSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    // Real-time listener so admin sees Firestore saves update live.
    const unsubscribe = listenToAllPets(
      (pets) => {
        setPetSaves(pets);
        setLoading(false);
      },
      (error) => {
        setErrorText(getFirebaseMessage(error));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <main className="max-w-3xl">
      <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-4 shadow-[0_6px_0_#44202a]">
        <h2 className="mb-3 text-2xl font-black text-zinc-900">Admin Page</h2>
        <p className="mb-2 text-sm font-bold text-zinc-900/80">Signed in as {signedInUser}</p>
        <p className="mb-2 text-sm font-bold text-zinc-900/80">Role: {userRole}</p>
        <p className="mb-2 text-sm font-bold text-zinc-900/80">Saved users: {petSaves.length}</p>
        <p className="mb-3 text-sm font-bold text-zinc-900/80">
          This page shows Firestore pet saves, not every auth account.
        </p>
        {loading ? <p className="mb-2 text-sm font-bold text-zinc-900/80">Loading saved users...</p> : null}
        {errorText ? <p className="mb-2 text-sm font-bold text-zinc-900/80">{errorText}</p> : null}
        {petSaves.map((petSave) => {
          const lastUpdatedText = petSave.updatedAt
            ? new Date(petSave.updatedAt).toLocaleString()
            : "No save time";

          return (
            <div
              className="mb-3 rounded-2xl border-2 border-zinc-900 bg-rose-100 px-3 py-3"
              key={petSave.id}
            >
              <p className="mb-1 text-sm font-bold text-zinc-900/80">{petSave.email || petSave.id}</p>
              <p className="mb-1 text-sm font-bold text-zinc-900/80">
                Pet: {petSave.pet?.petName || "Unnamed pet"}
              </p>
              <p className="mb-1 text-sm font-bold text-zinc-900/80">Level: {petSave.pet?.level ?? 1}</p>
              <p className="text-sm font-bold text-zinc-900/80">Updated: {lastUpdatedText}</p>
              <button
                className="mt-3 rounded-2xl border-2 border-zinc-900 bg-lime-300 px-3 py-2 text-sm font-black text-zinc-900 shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 hover:bg-yellow-200"
                onClick={() => onDeleteSave(petSave.id, petSave.email || petSave.id)}
                type="button"
              >
                Delete This Save
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default AdminPanel;

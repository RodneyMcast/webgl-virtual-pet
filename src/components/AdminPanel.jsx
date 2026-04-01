import { useEffect, useState } from "react";
import { getFirebaseMessage, listenToAllPets } from "../utils/firebase";

function AdminPanel({ onDeleteSave, signedInUser, userRole }) {
  const [petSaves, setPetSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
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
    <main className="admin-layout">
      <section className="panel">
        <h2>Admin Page</h2>
        <p className="small-text">Signed in as {signedInUser}</p>
        <p className="small-text">Role: {userRole}</p>
        <p className="small-text">Saved users: {petSaves.length}</p>
        <p className="small-text">
          This page shows Firestore pet saves, not every auth account.
        </p>
        {loading ? <p className="small-text">Loading saved users...</p> : null}
        {errorText ? <p className="small-text">{errorText}</p> : null}
        {petSaves.map((petSave) => {
          const lastUpdatedText = petSave.updatedAt
            ? new Date(petSave.updatedAt).toLocaleString()
            : "No save time";

          return (
            <div className="admin-user-card" key={petSave.id}>
              <p className="small-text">{petSave.email || petSave.id}</p>
              <p className="small-text">Pet: {petSave.pet?.petName || "Unnamed pet"}</p>
              <p className="small-text">Level: {petSave.pet?.level ?? 1}</p>
              <p className="small-text">Updated: {lastUpdatedText}</p>
            </div>
          );
        })}
        <button onClick={onDeleteSave} type="button">
          Delete Firestore Save
        </button>
      </section>
    </main>
  );
}

export default AdminPanel;

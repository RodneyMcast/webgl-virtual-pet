// Small stats panel showing the saved pet data that drives the scene.
function Meter({ label, value }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between text-sm font-black text-zinc-900">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full border-2 border-zinc-900 bg-rose-100">
        <div
          className="h-full rounded-full bg-lime-300 transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Shows the pet state, progression, and last save time.
function StatsPanel({ pet, signedInUser, unlockedColorCount }) {
  const lastSavedText = pet.lastSavedAt
    ? new Date(pet.lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-4 shadow-[0_6px_0_#44202a]">
      <h2 className="mb-3 text-2xl font-black text-zinc-900">Pet Stats</h2>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">
        {signedInUser ? `Signed in as ${signedInUser}` : "Not signed in"}
      </p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">{pet.petName}</p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">Level: {pet.level}</p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">
        EXP: {pet.exp}/{pet.expGoal}
      </p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">
        Feed EXP: {pet.feedExp}/{pet.goalCount}
      </p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">
        Play EXP: {pet.playExp}/{pet.goalCount}
      </p>
      <p className="mb-2 text-sm font-bold text-zinc-900/80">
        Colours Unlocked: {unlockedColorCount}/5
      </p>
      <p className="mb-3 text-sm font-bold text-zinc-900/80">Last Save: {lastSavedText}</p>
      <Meter label="Happiness" value={pet.happiness} />
      <Meter label="Hunger" value={pet.hunger} />
      <p className="text-sm font-bold text-zinc-900/80">Expression: {pet.expression}</p>
    </section>
  );
}

export default StatsPanel;

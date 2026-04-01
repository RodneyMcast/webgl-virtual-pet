function Meter({ label, value }) {
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="meter-bar">
        <div className="meter-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatsPanel({ pet, signedInUser, unlockedColorCount }) {
  const lastSavedText = pet.lastSavedAt
    ? new Date(pet.lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <section className="panel">
      <h2>Pet Stats</h2>
      <p className="small-text">
        {signedInUser ? `Signed in as ${signedInUser}` : "Not signed in"}
      </p>
      <p className="small-text">{pet.petName}</p>
      <p className="small-text">Level: {pet.level}</p>
      <p className="small-text">
        EXP: {pet.exp}/{pet.expGoal}
      </p>
      <p className="small-text">
        Feed EXP: {pet.feedExp}/{pet.goalCount}
      </p>
      <p className="small-text">
        Play EXP: {pet.playExp}/{pet.goalCount}
      </p>
      <p className="small-text">Colours Unlocked: {unlockedColorCount}/5</p>
      <p className="small-text">Last Save: {lastSavedText}</p>
      <Meter label="Happiness" value={pet.happiness} />
      <Meter label="Hunger" value={pet.hunger} />
      <p className="small-text">Expression: {pet.expression}</p>
    </section>
  );
}

export default StatsPanel;

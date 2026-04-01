function ControlPanel({
  activeView,
  onColourClick,
  onFeedClick,
  onToggleLight,
  onToyClick,
  onViewChange,
  lightMode,
}) {
  const buttonClass =
    "w-full rounded-2xl border-2 border-zinc-900 bg-lime-300 px-4 py-3 text-sm font-black text-zinc-900 shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 hover:bg-yellow-200";

  function getViewButtonClass(isActive) {
    return `rounded-2xl border-2 border-zinc-900 px-3 py-2 text-sm font-black shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 ${
      isActive ? "bg-yellow-100" : "bg-lime-300"
    }`;
  }

  return (
    <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-4 shadow-[0_6px_0_#44202a]">
      <h2 className="mb-3 text-2xl font-black text-zinc-900">Controls</h2>
      <button className={buttonClass} onClick={onToyClick} type="button">
        Drop Toy
      </button>
      <button className={`${buttonClass} mt-2.5`} onClick={onFeedClick} type="button">
        Feed Pet
      </button>
      <button className={`${buttonClass} mt-2.5`} onClick={onColourClick} type="button">
        Change Colour
      </button>

      <button className={`${buttonClass} mt-2.5`} onClick={onToggleLight} type="button">
        Light: {lightMode === "bright" ? "Bright" : "Soft"}
      </button>

      <h2 className="mb-3 mt-5 text-2xl font-black text-zinc-900">Views</h2>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <button
          className={getViewButtonClass(activeView === "front")}
          onClick={() => onViewChange("front")}
          type="button"
        >
          Front
        </button>
        <button
          className={getViewButtonClass(activeView === "close")}
          onClick={() => onViewChange("close")}
          type="button"
        >
          Close
        </button>
        <button
          className={getViewButtonClass(activeView === "room")}
          onClick={() => onViewChange("room")}
          type="button"
        >
          Room
        </button>
      </div>

      <p className="text-sm font-bold text-zinc-900/80">
        Scroll on the scene or press Space to trigger animation.
      </p>
    </section>
  );
}

export default ControlPanel;

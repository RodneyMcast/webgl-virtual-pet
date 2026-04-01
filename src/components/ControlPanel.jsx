function ControlPanel({
  activeView,
  onColourClick,
  onFeedClick,
  onToyClick,
  onViewChange,
}) {
  return (
    <section className="panel">
      <h2>Controls</h2>
      <button onClick={onToyClick} type="button">
        Drop Toy
      </button>
      <button onClick={onFeedClick} type="button">
        Feed Pet
      </button>
      <button onClick={onColourClick} type="button">
        Change Colour
      </button>

      <h2>Views</h2>
      <div className="view-row">
        <button
          className={activeView === "front" ? "button-active" : ""}
          onClick={() => onViewChange("front")}
          type="button"
        >
          Front
        </button>
        <button
          className={activeView === "close" ? "button-active" : ""}
          onClick={() => onViewChange("close")}
          type="button"
        >
          Close
        </button>
        <button
          className={activeView === "room" ? "button-active" : ""}
          onClick={() => onViewChange("room")}
          type="button"
        >
          Room
        </button>
      </div>

      <p className="small-text">Scroll on the scene or press Space to trigger animation.</p>
    </section>
  );
}

export default ControlPanel;

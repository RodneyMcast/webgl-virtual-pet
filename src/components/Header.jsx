import { NavLink } from "react-router-dom";

function Header({
  busy,
  emailInput,
  onEmailChange,
  onPasswordChange,
  onRegister,
  onSave,
  onSignIn,
  onSignOut,
  passwordInput,
  signedInUser,
  statusMessage,
  userRole,
}) {
  return (
    <header className="header">
      <h1>Simple Blob Pet</h1>

      <div className="nav-row">
        <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
          Home
        </NavLink>
        {signedInUser && userRole === "admin" ? (
          <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/admin">
            Admin
          </NavLink>
        ) : null}
      </div>

      <div className="signin-bar">
        {signedInUser ? (
          <>
            <button disabled={busy} onClick={onSave} type="button">
              Save
            </button>
            <button disabled={busy} onClick={onSignOut} type="button">
              Sign out
            </button>
          </>
        ) : (
          <>
            <input
              disabled={busy}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="email"
              type="email"
              value={emailInput}
            />
            <input
              disabled={busy}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="password"
              type="password"
              value={passwordInput}
            />
            <button disabled={busy} onClick={onRegister} type="button">
              Create account
            </button>
            <button disabled={busy} onClick={onSignIn} type="button">
              Sign in
            </button>
          </>
        )}
      </div>

      <p className="header-status">{signedInUser ? `${signedInUser} (${userRole})` : statusMessage}</p>
      {signedInUser && statusMessage ? <p className="header-status">{statusMessage}</p> : null}
    </header>
  );
}

export default Header;

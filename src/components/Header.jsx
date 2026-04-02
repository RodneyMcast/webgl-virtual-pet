// Top bar for sign in, save, sound toggles, and page navigation.
import { NavLink } from "react-router-dom";

const buttonClass =
  "rounded-2xl border-2 border-zinc-900 bg-lime-300 px-4 py-2.5 text-sm font-black text-zinc-900 shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70";
const inputClass =
  "min-w-[220px] flex-1 rounded-2xl border-2 border-zinc-900 bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-rose-500";

function Header({
  busy,
  dogSoundsMuted,
  emailInput,
  musicMuted,
  onEmailChange,
  onPasswordChange,
  onRegister,
  onSave,
  onSignIn,
  onSignOut,
  onToggleDogSounds,
  onToggleMusic,
  passwordInput,
  signedInUser,
  statusMessage,
  userRole,
}) {
  return (
    <header className="mb-4 rounded-[26px] border-[3px] border-zinc-900 bg-rose-100 px-4 py-4 shadow-[0_8px_0_#53303a] md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
            Simple Blob Pet
          </h1>

          <div className="flex flex-wrap gap-2">
            <NavLink
              className={({ isActive }) =>
                `rounded-2xl border-2 border-zinc-900 px-4 py-2 text-sm font-black shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 ${
                  isActive ? "bg-lime-300" : "bg-yellow-100"
                }`
              }
              to="/"
            >
              Home
            </NavLink>
            {signedInUser && userRole === "admin" ? (
              <NavLink
                className={({ isActive }) =>
                  `rounded-2xl border-2 border-zinc-900 px-4 py-2 text-sm font-black shadow-[0_4px_0_#3a251f] transition hover:-translate-y-0.5 ${
                    isActive ? "bg-lime-300" : "bg-yellow-100"
                  }`
                }
                to="/admin"
              >
                Admin
              </NavLink>
            ) : null}
          </div>
        </div>

        <div className="flex w-full max-w-xl flex-wrap gap-2 md:justify-end">
          <button className={buttonClass} disabled={busy} onClick={onToggleMusic} type="button">
            Music {musicMuted ? "Off" : "On"}
          </button>
          <button className={buttonClass} disabled={busy} onClick={onToggleDogSounds} type="button">
            Dog Sounds {dogSoundsMuted ? "Off" : "On"}
          </button>
          {signedInUser ? (
            <>
              <button className={buttonClass} disabled={busy} onClick={onSave} type="button">
                Save
              </button>
              <button className={buttonClass} disabled={busy} onClick={onSignOut} type="button">
                Sign out
              </button>
            </>
          ) : (
            <>
              <input
                className={inputClass}
                disabled={busy}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="email"
                type="email"
                value={emailInput}
              />
              <input
                className={inputClass}
                disabled={busy}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="password"
                type="password"
                value={passwordInput}
              />
              <button className={buttonClass} disabled={busy} onClick={onRegister} type="button">
                Create account
              </button>
              <button className={buttonClass} disabled={busy} onClick={onSignIn} type="button">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm font-black text-zinc-900/90">
        {signedInUser ? `${signedInUser} (${userRole})` : statusMessage}
      </p>
      {signedInUser && statusMessage ? (
        <p className="mt-2 text-sm font-bold text-zinc-900/80">{statusMessage}</p>
      ) : null}
    </header>
  );
}

export default Header;

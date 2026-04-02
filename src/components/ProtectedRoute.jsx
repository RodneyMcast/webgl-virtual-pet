// Route guard file. This blocks pages unless the user is signed in or is an admin.
import { Navigate } from "react-router-dom";

// Used for the protected admin page.
function ProtectedRoute({ busy, signedInUser, userRole, requireAdmin = false, children }) {
  if (busy) {
    return (
      <main className="max-w-3xl">
        <section className="rounded-[22px] border-[3px] border-zinc-900 bg-rose-400 px-4 py-5 text-sm font-bold text-zinc-900 shadow-[0_6px_0_#44202a]">
          <p>Loading...</p>
        </section>
      </main>
    );
  }

  if (!signedInUser) {
    return <Navigate replace to="/" />;
  }

  if (requireAdmin && userRole !== "admin") {
    return <Navigate replace to="/" />;
  }

  return children;
}

export default ProtectedRoute;

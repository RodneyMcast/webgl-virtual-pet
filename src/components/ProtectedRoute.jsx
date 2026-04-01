import { Navigate } from "react-router-dom";

function ProtectedRoute({ busy, signedInUser, userRole, requireAdmin = false, children }) {
  if (busy) {
    return (
      <main className="admin-layout">
        <section className="panel">
          <p className="small-text">Loading...</p>
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

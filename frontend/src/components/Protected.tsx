import { Navigate, useLocation } from "react-router-dom";

import { Role, useAuth } from "../auth";

export default function Protected({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <p>Verifying your session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (user.role !== role) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

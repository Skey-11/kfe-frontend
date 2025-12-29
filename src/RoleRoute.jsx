import { Navigate } from "react-router-dom";
import { getToken, getUser } from "./auth";

export default function RoleRoute({
  allow = [],
  redirectTo = "/pos",
  children,
}) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  const user = getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const ok = allow.length === 0 || allow.some((r) => roles.includes(r));

  if (!ok) return <Navigate to={redirectTo} replace />;

  return children;
}

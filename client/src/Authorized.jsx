import { Navigate } from "react-router-dom";

function Authorized({ children }) {
  const isLoggedIn = false; // Replace with real auth logic

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default Authorized;

import { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "./services/authServices";
import { UserContext } from "./context/UserContext";

function Authorized({ children }) {
  const { loggedInUser, setLoggedInUser } = useContext(UserContext);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const result = await getMe();
      if (result?.success) {
        setLoggedInUser(result.user);
      }
      setCheckedAuth(true);
    }
    checkAuth();
  }, [setLoggedInUser]);

  if (!checkedAuth) {
    return null;
  }

  return loggedInUser ? children : <Navigate to="/login" replace />;
}

export default Authorized;

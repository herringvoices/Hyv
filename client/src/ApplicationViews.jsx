import { Routes, Route, Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Logout from "./pages/Logout";
import Friends from "./pages/Friends";
import FriendDetails from "./pages/FriendDetails";

function ApplicationViews() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <div className="shadow-sm shadow-primary">
              <NavBar />
            </div>
            <Outlet />
          </>
        }
      >
        <Route path="windows" element={<div>Windows Placeholder</div>} />
        <Route path="hive" element={<div>Hive Placeholder</div>} />
        <Route path="friends">
          <Route index element={<Friends />} />
          <Route path=":friendId" element={<FriendDetails />} />
        </Route>
        <Route path="hangouts" element={<div>Hangouts Placeholder</div>} />
      </Route>
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default ApplicationViews;

import "./App.css";
import { useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Authorized from "./Authorized";
import ApplicationViews from "./ApplicationViews";
import { UserProvider } from "./context/UserContext";
library.add(fas, far, fab);

function App() {
  const [open, setOpen] = useState(false);

  console.log("App component rendered");

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="*"
            element={
              <Authorized>
                {console.log("Rendering Authorized component")}
                <ApplicationViews />
              </Authorized>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;

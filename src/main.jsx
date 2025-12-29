import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Pos from "./pages/Pos";
import ProtectedRoute from "./ProtectedRoute";
import Inventory from "./pages/Inventory";
import RoleRoute from "./RoleRoute";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Pos />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/pos" replace />} />
        <Route
  path="/inventory"
  element={
    <RoleRoute allow={["manager", "admin"]}>
      <Inventory />
    </RoleRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// gatsby-browser.js
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import "./src/styles/global.css"; // Keep existing CSS import

// Wrap the root element with the AuthProvider
export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>;
};

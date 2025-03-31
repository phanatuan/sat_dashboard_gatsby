import React from "react";
import { AuthProvider } from "./src/context/AuthContext";

// Mirror the wrapRootElement from gatsby-browser.js
export const wrapRootElement = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>;
};

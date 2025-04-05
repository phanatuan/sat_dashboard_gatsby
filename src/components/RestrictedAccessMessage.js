import React from "react";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "./GoogleSignInButton";

const RestrictedAccessMessage = ({
  title = "Access Restricted", // Default title in English
  message = "This page requires you to be logged in. Please sign in with Google to continue.", // Default message in English
  buttonLabel = "Sign in with Google", // Default button label in English
}) => {
  const { signInWithProvider } = useAuth(); // Get the sign-in function

  return (
    <div className="text-center p-8 border border-gray-200 rounded-lg shadow-sm bg-white mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="inline-block">
        {" "}
        {/* Container for button sizing */}
        <GoogleSignInButton
          onClick={() => signInWithProvider({ provider: "google" })}
          label={buttonLabel}
        />
      </div>
    </div>
  );
};

export default RestrictedAccessMessage;

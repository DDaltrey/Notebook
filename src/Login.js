import React from "react";
import { auth, provider } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";

const ALLOWED_EMAIL = "daltreydrew@gmail.com"; // ✅ Replace with your actual email

const Login = ({ user, setUser }) => {
  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        if (result.user.email === ALLOWED_EMAIL) {
          setUser(result.user); // ✅ Allow access
          console.log("User signed in:", result.user);
        } else {
          signOut(auth); // ❌ Sign out unauthorized users
          setUser(null);
          alert("Access denied: This app is restricted to a specific user.");
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      });
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        setUser(null); // Clear user state
        console.log("User signed out");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <div>
      {user ? (
        <>
          <h2>Welcome, {user.displayName}!</h2>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <h2>Have you signed in yet?</h2>
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        </>
      )}
    </div>
  );
};

export default Login;

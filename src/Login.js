import React from "react";
import { auth, provider } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";
import "./Login.css"; // Import the CSS file

const ALLOWED_EMAIL = "daltreydrew@gmail.com";

const Login = ({ user, setUser }) => {
  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        if (result.user.email === ALLOWED_EMAIL) {
          setUser(result.user);
          console.log("User signed in:", result.user);
        } else {
          signOut(auth);
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
        setUser(null);
        console.log("User signed out");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {user ? (
          <>
            <h2>Welcome, {user.displayName}!</h2>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <h2 className="login-title">Login</h2>
            <button className="login-btn" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

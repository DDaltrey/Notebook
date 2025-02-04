import React, { useState, useEffect } from "react";
import Workbooks from "./Workbooks";
import Pages from "./Pages";
import Notes from "./Notes";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login"; // We'll create this next
console.log("thisisatest");
const App = () => {
  const [user, setUser] = useState(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Logout function
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div>
      <h1>Evernote Clone</h1>

      {/* Show login if no user is logged in */}
      {!user ? (
        
        <Login />
      ) : (
        <>
        
          <button onClick={handleLogout}>Logout</button>

          {/* Navigation */}
          {selectedWorkbook && (
            <button onClick={() => setSelectedWorkbook(null)}>Back to Workbooks</button>
          )}
          {selectedPage && (
            <button onClick={() => setSelectedPage(null)}>Back to Pages</button>
          )}

          {/* Routing Logic */}
          {!selectedWorkbook ? (
            <Workbooks onSelectWorkbook={setSelectedWorkbook} />
          ) : !selectedPage ? (
            <Pages workbookId={selectedWorkbook} onSelectPage={setSelectedPage} />
          ) : (
            <Notes workbookId={selectedWorkbook} pageId={selectedPage} />
          )}
        </>
      )}
    </div>
  );
};

export default App;

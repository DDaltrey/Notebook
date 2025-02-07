// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Notes from "./Notes";
import Dashboard from "./Dashboard";
import Workbooks from "./Workbooks";
import Pages from "./Pages";
import Login from "./Login";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [workbooks, setWorkbooks] = useState([]);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchWorkbooks(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWorkbooks = async (userId) => {
    try {
      const q = query(collection(db, "workbooks"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const workbooksArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkbooks(workbooksArray);
    } catch (error) {
      console.error("Error fetching workbooks:", error);
    }
  };

  const fetchPages = async (workbookId) => {
    if (!workbookId) return;
    try {
      const pagesCollection = collection(db, `workbooks/${workbookId}/pages`);
      const querySnapshot = await getDocs(pagesCollection);
      const pagesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPages(pagesArray);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const createWorkbook = async (workbookName) => {
    if (!user || workbookName.trim() === "") return;
    try {
      const docRef = await addDoc(collection(db, "workbooks"), {
        name: workbookName,
        userId: user.uid,
      });
      setWorkbooks((prev) => [
        ...prev,
        { id: docRef.id, name: workbookName, userId: user.uid },
      ]);
    } catch (error) {
      console.error("Error creating workbook:", error);
    }
  };

  const createPage = async (pageName, workbookId) => {
    if (!user || pageName.trim() === "" || !workbookId) return;
    try {
      const docRef = await addDoc(collection(db, `workbooks/${workbookId}/pages`), {
        name: pageName,
      });
      setPages((prev) => [...prev, { id: docRef.id, name: pageName }]);
    } catch (error) {
      console.error("Error creating page:", error);
    }
  };

  const deletePage = async (workbookId, pageId) => {
    try {
      // Delete all notes within the page first
      const notesRef = collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`);
      const notesSnapshot = await getDocs(notesRef);
      const deleteNotePromises = notesSnapshot.docs.map((note) =>
        deleteDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, note.id))
      );
      await Promise.all(deleteNotePromises);
      // Now delete the page
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages`, pageId));
      await fetchPages(workbookId);
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const deleteWorkbook = async (workbookId) => {
    try {
      // First, delete all pages (and their notes) in the workbook
      const pagesRef = collection(db, `workbooks/${workbookId}/pages`);
      const pagesSnapshot = await getDocs(pagesRef);
      for (let page of pagesSnapshot.docs) {
        await deletePage(workbookId, page.id);
      }
      // Then delete the workbook
      await deleteDoc(doc(db, "workbooks", workbookId));
      setWorkbooks((prev) => prev.filter((w) => w.id !== workbookId));
      setPages([]);
    } catch (error) {
      console.error("Error deleting workbook:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <Router basename="/Notebook">
      <div className="app-container">
        {user && (
          <Sidebar
            user={user}
            onLogout={handleLogout}
            workbooks={workbooks}
            pages={pages}
            fetchPages={fetchPages}
            createWorkbook={createWorkbook}
            createPage={createPage}
            deleteWorkbook={deleteWorkbook}
            deletePage={deletePage}
          />
        )}
        <div className={user ? "main-content logged-in" : "main-content login-screen"}>
          {!user ? (
            <Login />
          ) : (
            <Routes>
              {/* Dashboard route when no workbook/page is selected */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Route to display the Pages list for a selected workbook */}
              <Route path="/workbook/:workbookId" element={<Pages />} />
              
              {/* Route to view notes in a specific page (optional note id to preselect a note) */}
              <Route path="/workbook/:workbookId/page/:pageId" element={<Notes />} />
              <Route path="/workbook/:workbookId/page/:pageId/note/:noteId" element={<Notes />} />
              
              {/* Redirect any unmatched route to the dashboard */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
};

export default App;

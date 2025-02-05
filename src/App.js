import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Pages from "./Pages";
import Notes from "./Notes";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import Login from "./Login";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [workbooks, setWorkbooks] = useState([]);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) fetchWorkbooks(user.uid);
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
      const q = collection(db, `workbooks/${workbookId}/pages`);
      const querySnapshot = await getDocs(q);
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

      setWorkbooks((prev) => [...prev, { id: docRef.id, name: workbookName, userId: user.uid }]);
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
      // Delete all notes within the page
      const notesRef = collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`);
      const notesSnapshot = await getDocs(notesRef);

      const deleteNotePromises = notesSnapshot.docs.map((note) => deleteDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, note.id)));

      await Promise.all(deleteNotePromises); // Delete all notes first

      // Now delete the page
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages`, pageId));

      // Update state
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const deleteWorkbook = async (workbookId) => {
    try {
      // Fetch all pages inside the workbook
      const pagesRef = collection(db, `workbooks/${workbookId}/pages`);
      const pagesSnapshot = await getDocs(pagesRef);

      // Loop through pages and delete their notes first
      for (let page of pagesSnapshot.docs) {
        await deletePage(workbookId, page.id); // This also deletes its notes
      }

      // Now delete the workbook
      await deleteDoc(doc(db, "workbooks", workbookId));

      // Update state
      setWorkbooks((prev) => prev.filter((w) => w.id !== workbookId));
      setSelectedWorkbook(null);
      setPages([]);
    } catch (error) {
      console.error("Error deleting workbook:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="app-container">
      {user && (
        <Sidebar
        user={user}
          onLogout={handleLogout}
          onSelectWorkbook={(id) => {
            setSelectedWorkbook(id);
            fetchPages(id);
          }}
          onSelectPage={setSelectedPage}
          selectedPage={selectedPage}
          selectedWorkbook={selectedWorkbook}
          createWorkbook={createWorkbook}
          createPage={createPage}
          deleteWorkbook={deleteWorkbook} // ✅ Pass deleteWorkbook
          deletePage={deletePage} // ✅ Pass deletePage
          workbooks={workbooks}
          pages={pages}
        />
      )}

<div className={user ? "main-content logged-in" : "main-content login-screen"}>
        {!user ? (
          <Login />
        ) : (
          selectedPage && (
            <>
              
              <Notes workbookId={selectedWorkbook} page={pages.find(p => p.id === selectedPage)} />

            </>
          )
        )}
      </div>
    </div>
  );
};

export default App;

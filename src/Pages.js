import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";

const Pages = ({ workbookId, onSelectPage }) => {
  const [pages, setPages] = useState([]);

  // Fetch pages inside the selected workbook
  const fetchPages = async () => {
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

  // Function to delete a page
  const deletePage = async (pageId) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;

    try {
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages`, pageId));
      fetchPages(); // Refresh the list
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [workbookId]);

  return (
    <div>
      <h3>Existing Pages:</h3>
      <ul>
        {pages.map((pg) => (
          <li key={pg.id}>
            <span onClick={() => onSelectPage(pg.id)}>{pg.name}</span>
            <button className="delete-btn" onClick={() => deletePage(pg.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pages;

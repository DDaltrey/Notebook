import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const Pages = ({ workbookId, onSelectPage }) => {
  const [pageName, setPageName] = useState("");
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

  // Function to create a new page
  const createPage = async () => {
    if (pageName.trim() === "") {
      alert("Page name cannot be empty!");
      return;
    }

    try {
      await addDoc(collection(db, `workbooks/${workbookId}/pages`), {
        name: pageName,
      });

      setPageName("");
      fetchPages(); // Refresh the list
    } catch (error) {
      console.error("Error creating page:", error);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [workbookId]);

  return (
    <div>
      <h2>Pages in Selected Workbook</h2>
      <input
        type="text"
        placeholder="Enter page name"
        value={pageName}
        onChange={(e) => setPageName(e.target.value)}
      />
      <button onClick={createPage}>Create Page</button>

      <h3>Existing Pages:</h3>
      <ul>
        {pages.map((pg) => (
          <li key={pg.id} onClick={() => onSelectPage(pg.id)}>
            {pg.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pages;

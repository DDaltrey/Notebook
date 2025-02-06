// Pages.js
import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Link, useParams } from "react-router-dom";

const Pages = () => {
  const { workbookId } = useParams();
  const [pages, setPages] = useState([]);

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

  const deletePage = async (pageId) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    try {
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages`, pageId));
      fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [workbookId]);

  return (
    <div>
      <ul>
        {pages.map((pg) => (
          <li key={pg.id}>
            <Link to={`/workbook/${workbookId}/page/${pg.id}`}>{pg.name}</Link>
            <button className="delete-btn" onClick={() => deletePage(pg.id)}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pages;

// Dashboard.js
import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Dashboard = () => {
  const [recentNotes, setRecentNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentNotes();
  }, []);

  const fetchRecentNotes = async () => {
    try {
      const workbooksSnapshot = await getDocs(collection(db, "workbooks"));
      let allNotes = [];
      for (const workbookDoc of workbooksSnapshot.docs) {
        const pagesSnapshot = await getDocs(
          collection(db, `workbooks/${workbookDoc.id}/pages`)
        );
        for (const pageDoc of pagesSnapshot.docs) {
          const notesQuery = query(
            collection(db, `workbooks/${workbookDoc.id}/pages/${pageDoc.id}/notes`),
            orderBy("lastModified", "desc")
          );
          const notesSnapshot = await getDocs(notesQuery);
          const pageNotes = notesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            workbookId: workbookDoc.id,
            pageId: pageDoc.id,
          }));
          allNotes = [...allNotes, ...pageNotes];
        }
      }
      allNotes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      setRecentNotes(allNotes.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent notes:", error);
    }
  };

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <h2>Welcome Back!</h2>
        <p>Get started by selecting or creating a notebook.</p>
      </div>
      <div className="recent-notes-section">
        <h3>Recent Notes</h3>
        {recentNotes.length > 0 ? (
          <ul className="recent-notes-list">
            {recentNotes.map((note) => (
              <li
                key={note.id}
                className="recent-note-item"
                onClick={() =>
                  navigate(`/workbook/${note.workbookId}/page/${note.pageId}/note/${note.id}`)
                }
              >
                <strong>{note.title}</strong>
                <br />
                <small>
                  Last Edited: {new Date(note.lastModified).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent notes. Start writing!</p>
        )}
      </div>
      <div className="dashboard-tips">
        <h3>Tips to Get Started</h3>
        <ul>
          <li>📒 Create a notebook to organize your notes.</li>
          <li>📄 Add pages inside a notebook to structure content.</li>
          <li>📝 Start writing notes with the built-in editor.</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;

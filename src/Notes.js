import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./App.css";

const Notes = ({ workbookId, pageId }) => {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [titles, setTitles] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [pagesExist, setPagesExist] = useState(false); // Track if pages exist

  useEffect(() => {
    if (workbookId) {
      checkPagesExist();
    }
  }, [workbookId]);

  useEffect(() => {
    if (workbookId && pageId) {
      fetchNotes();
    }
  }, [workbookId, pageId]);

  // Check if pages exist in the selected workbook
  const checkPagesExist = async () => {
    try {
      const pagesCollection = collection(db, `workbooks/${workbookId}/pages`);
      const pagesSnapshot = await getDocs(pagesCollection);
      setPagesExist(!pagesSnapshot.empty);
    } catch (error) {
      console.error("Error checking pages:", error);
      setPagesExist(false);
    }
  };

  const fetchNotes = async () => {
    if (!workbookId || !pageId) return; // Prevent fetching if nothing is selected

    try {
      const q = query(
        collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`),
        orderBy("lastModified", "desc") // Order by last modified, newest first
      );

      const querySnapshot = await getDocs(q);
      const notesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesArray);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };
  

  const addNote = async () => {
    if (note.trim() === "") return alert("Note cannot be empty!");

    try {
      await addDoc(collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`), {
        title: title,
        text: note,
        createdAt: new Date().toISOString(), // Save creation timestamp
        lastModified: new Date().toISOString(), // Save last modified timestamp
      });
      setNote("");
      setTitle("");
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };
  const startEditing = (noteId, text, last) => {
    setEditingNoteId(noteId);
    setEditingText(text);
  };

  const saveEditedNote = async () => {
    
    if (editingText.trim() === "") {
      alert("Note cannot be empty!");
      return;
    }

    try {
      const noteRef = doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, editingNoteId);
      await updateDoc(noteRef, { 
        text: editingText,
        lastModified: new Date().toISOString(), // Update last modified timestamp 
    });
      
      setEditingNoteId(null);
      setEditingText("");
      
      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };
  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, noteId));
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const toggleExpand = (noteId) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  const extractHeaderPreview = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const header = tempDiv.querySelector("h1, h2, h3, h4, h5, h6");
    if (header) {
      return header.innerText.length > 20 ? header.innerText.substring(0, 20) + "..." : header.innerText;
    }

    return null;
  };

  // Display messages based on state
  if (!workbookId) {
    return <div className="container"><h3>Select a workbook to view notes.</h3></div>;
  }

  if (!pagesExist) {
    return <div className="container"><h3>No pages found. Create a page to start writing notes.</h3></div>;
  }

  if (!pageId) {
    return <div className="container"><h3>Select a page to start writing notes.</h3></div>;
  }

  return (
    <div className="container">
      <h2>Notes in Selected Page</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Write a Title..."
      />
      <ReactQuill value={note} onChange={setNote} placeholder="Write a note..." />
      <button class="save-button" onClick={addNote}>Save Note</button>

      <h3>Saved Notes:</h3>
      <ul className="notes-list">
        {notes.map((n) => {
          const firstLine = n.text.split("\n")[0]; // Get first line of note
          const isExpanded = expandedNotes[n.id];
          const title = n.title;

          return (
            <li key={n.id} className="note-item">
              {editingNoteId === n.id ? (
                <>
                  <ReactQuill value={editingText} onChange={setEditingText} />
                  <button class="save-button" onClick={saveEditedNote}>Save</button>
                  <button class="save-button" onClick={() => setEditingNoteId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="note-content">
                  <div
                      className="note-text"
                      style={{ fontSize: "16px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                      dangerouslySetInnerHTML={{ __html: title }}
                    ></div>
                    <div
                      className="note-text"
                      style={{ fontSize: "16px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                      dangerouslySetInnerHTML={{ __html: isExpanded ? n.text : firstLine }}
                    ></div>
                    <small>Last Modified: {new Date(n.lastModified).toLocaleString()}</small>
                    {n.text !== firstLine && (
                      <button className="show-more-btn" onClick={() => toggleExpand(n.id)}>
                        {isExpanded ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                  <div className="note-actions">
                    <button className="edit-btn" onClick={() => startEditing(n.id, n.text)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteNote(n.id)}>🗑️</button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Notes;

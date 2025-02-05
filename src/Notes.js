import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./App.css";

const Notes = ({ workbookId, page }) => {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [pagesExist, setPagesExist] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // <- Search input state

  const pageId = page?.id;
  const pageName = page?.name || "Selected Page";

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
    if (!workbookId || !pageId) return;

    try {
      const q = query(
        collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`),
        orderBy("lastModified", "desc")
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
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
      setNote("");
      setTitle("");
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const startEditing = (noteId, noteTitle, noteText) => {
    setEditingNoteId(noteId);
    setEditingTitle(noteTitle);
    setEditingText(noteText);
    setTitle(noteTitle);
    setNote(noteText);
    setSelectedNote(null); // Hide the displayed note when editing
  };

  const saveEditedNote = async () => {
    if (!editingNoteId) return;

    try {
      const noteRef = doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, editingNoteId);
      await updateDoc(noteRef, {
        title: editingTitle,
        text: editingText,
        lastModified: new Date().toISOString(),
      });

      setEditingNoteId(null);
      setEditingTitle("");
      setEditingText("");
      setTitle("");
      setNote("");
      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };
  const duplicateNote = async (note) => {
    try {
      await addDoc(collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`), {
        title: `${note.title} (Copy)`,
        text: note.text,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
      fetchNotes(); // Refresh notes list
    } catch (error) {
      console.error("Error duplicating note:", error);
    }
  };
  
  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, noteId));
      fetchNotes();
      if (selectedNote?.id === noteId) setSelectedNote(null);
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditingTitle("");
        setEditingText("");
        setTitle("");
        setNote("");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };
{/* Filter notes based on searchTerm */}
const filteredNotes = notes.filter((n) =>
  n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
  n.text.toLowerCase().includes(searchTerm.toLowerCase())
);
  const showNote = (note) => {
    setSelectedNote(note);
    setEditingNoteId(null); // Exit editing mode
  };

  // Display messages based on state
  if (!workbookId) {
    return (
      <div className="container">
        <h3>Select a workbook to view notes.</h3>
      </div>
    );
  }

  if (!pagesExist) {
    return (
      <div className="container">
        <h3>No pages found. Create a page to start writing notes.</h3>
      </div>
    );
  }

  if (!pageId) {
    return (
      <div className="container">
        <h3>Select a page to start writing notes.</h3>
      </div>
    );
  }

  return (
    <div className="notesPageContainer">
      {/* Sidebar (40%) */}
      <div className="notesSidebar">
         {/* Search Bar */}
      <input 
        type="text" 
        className="search-bar" 
        placeholder="Search pages..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} // <- Update state
      />
        <h2>Saved Notes</h2>
        <button className="new-note-btn" onClick={() => setEditingNoteId("new")}>
          New Note
        </button>
        <ul className="notes-list">
  {filteredNotes.length > 0 ? (
    filteredNotes.map((n) => (
      <li key={n.id} className="note-item">
        <div className="note-content" onClick={() => showNote(n)}>
          <h3 className="note-title">
            {n.title.length > 15 ? n.title.substring(0, 15) + "..." : n.title}
          </h3>
          <small>Last Modified: {new Date(n.lastModified).toLocaleString()}</small>
        </div>
        <div className="note-actions">
          <button className="edit-btn" onClick={() => startEditing(n.id, n.title, n.text)}>
            Edit
          </button>
          <button className="duplicate-btn" onClick={() => duplicateNote(n)}>📄</button>
          <button className="delete-btn" onClick={() => deleteNote(n.id)}>🗑️</button>
        </div>
      </li>
    ))
  ) : (
    <p>No notes found.</p> // Message when no results match
  )}
</ul>
      </div>

      {/* Full Note View or Editor (60%) */}
      
      <div className="notesEditor">
      <h1 className="pageTitle">Notes in {pageName}</h1>
          <div className="editorContent">
        {editingNoteId ? (
          <>
            <input 
              className="titleInput" 
              value={editingNoteId === "new" ? title : editingTitle} 
              onChange={(e) => editingNoteId === "new" ? setTitle(e.target.value) : setEditingTitle(e.target.value)}
              placeholder="Write a Title..." 
            />
            <ReactQuill 
              value={editingNoteId === "new" ? note : editingText} 
              onChange={(value) => editingNoteId === "new" ? setNote(value) : setEditingText(value)}
              placeholder="Write a note..." 
            />
            <button className="save-button" onClick={editingNoteId === "new" ? addNote : saveEditedNote}>
              {editingNoteId === "new" ? "Save Note" : "Save Changes"}
            </button>
          </>
        ) : selectedNote ? (
          <>
            <h2>{selectedNote.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: selectedNote.text }}></div>
          </>
        ) : (
          <p>Select a note to view or create a new one.</p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Notes;

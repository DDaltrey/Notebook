import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useParams, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";  // <-- Add this line
import "./App.css";

const Notes = () => {
  const { workbookId, pageId, noteId } = useParams();
  const navigate = useNavigate();

  const [currentTitle, setCurrentTitle] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [pagesExist, setPagesExist] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageName, setPageName] = useState("Selected Page");

  useEffect(() => {
    if (workbookId) {
      checkPagesExist();
      fetchPageName();
    }
  }, [workbookId, pageId]);

  useEffect(() => {
    if (workbookId && pageId) {
      fetchNotes().then((notesArray) => {
        // If a noteId is in the URL, try to preselect that note.
        if (noteId) {
          const noteFromUrl = notesArray.find((n) => n.id === noteId);
          if (noteFromUrl) {
            setSelectedNote(noteFromUrl);
          } else if (notesArray.length > 0) {
            setSelectedNote(notesArray[0]);
          }
        } else if (!selectedNote && notesArray.length > 0) {
          setSelectedNote(notesArray[0]);
        }
      });
    }
  }, [workbookId, pageId, noteId]);

  const fetchPageName = async () => {
    try {
      const pageRef = doc(db, `workbooks/${workbookId}/pages`, pageId);
      const pageSnap = await getDoc(pageRef);
      if (pageSnap.exists()) {
        setPageName(pageSnap.data().name);
      }
    } catch (error) {
      console.error("Error fetching page name:", error);
    }
  };

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
    if (!workbookId || !pageId) return [];
    try {
      const notesQuery = query(
        collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`),
        orderBy("lastModified", "desc")
      );
      const querySnapshot = await getDocs(notesQuery);
      const notesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesArray);
      return notesArray;
    } catch (error) {
      console.error("Error fetching notes:", error);
      return [];
    }
  };

  const handleNewNote = () => {
    setCurrentTitle("");
    setCurrentText("");
    setEditingNoteId("new");
  };

  const clearEditingState = () => {
    setEditingNoteId(null);
    setCurrentTitle("");
    setCurrentText("");
  };

  const addNote = async () => {
    if (currentText.trim() === "") return alert("Note cannot be empty!");
    try {
      const docRef = await addDoc(
        collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`),
        {
          title: currentTitle,
          text: currentText,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        }
      );
      clearEditingState();
      fetchNotes();
      navigate(`/Notebook/workbook/${workbookId}/page/${pageId}/note/${docRef.id}`);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setCurrentTitle(note.title);
    setCurrentText(note.text);
    setSelectedNote(null);
    navigate(`/Notebook/workbook/${workbookId}/page/${pageId}`);
  };

  const saveEditedNote = async () => {
    if (!editingNoteId) return;
    try {
      await updateDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, editingNoteId), {
        title: currentTitle,
        text: currentText,
        lastModified: new Date().toISOString(),
      });
      clearEditingState();
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
      fetchNotes();
    } catch (error) {
      console.error("Error duplicating note:", error);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, `workbooks/${workbookId}/pages/${pageId}/notes`, note.id));
      fetchNotes();
      if (selectedNote?.id === note.id) setSelectedNote(null);
      if (editingNoteId === note.id) clearEditingState();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNote = (note) => {
    setSelectedNote(note);
    clearEditingState();
    navigate(`/Notebook/workbook/${workbookId}/page/${pageId}/note/${note.id}`);
  };

  if (!workbookId) {
    return <Dashboard />;
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
      {/* Sidebar for Notes */}
      <div className="notesSidebar">
        <input
          type="text"
          className="search-bar"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <h2>Saved Notes</h2>
        <button className="new-note-btn" onClick={handleNewNote}>
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
                  <small>
                    Last Modified: {new Date(n.lastModified).toLocaleString()}
                  </small>
                </div>
                <div className="note-actions">
                  <button className="edit-btn" onClick={() => startEditing(n)}>
                    Edit
                  </button>
                  <button className="duplicate-btn" onClick={() => duplicateNote(n)}>
                    📄
                  </button>
                  <button className="delete-btn" onClick={() => deleteNote(n)}>
                    🗑️
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p>No notes found.</p>
          )}
        </ul>
      </div>

      {/* Note Editor / Viewer */}
      <div className="notesEditor">
        <h1 className="pageTitle">Notes in {pageName}</h1>
        <div className="editorContent">
          {editingNoteId ? (
            <>
              <input
                className="titleInput"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Write a Title..."
              />
              <ReactQuill
                value={currentText}
                onChange={setCurrentText}
                placeholder="Write a note..."
              />
              <button
                className="save-button"
                onClick={editingNoteId === "new" ? addNote : saveEditedNote}
              >
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

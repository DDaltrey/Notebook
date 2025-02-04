import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const Notes = ({ workbookId, pageId }) => {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  // Fetch notes inside a specific page
  const fetchNotes = async () => {
    try {
      const q = collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`);
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

  // Function to add a note
  const addNote = async () => {
    if (note.trim() === "") {
      alert("Note cannot be empty!");
      return;
    }

    try {
      await addDoc(collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`), {
        text: note,
        timestamp: new Date(),
      });

      setNote("");
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [workbookId, pageId]);

  return (
    <div>
      <h2>Notes in Selected Page</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a note..."
      />
      <button onClick={addNote}>Save Note</button>

      <h3>Saved Notes:</h3>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>{n.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default Notes;

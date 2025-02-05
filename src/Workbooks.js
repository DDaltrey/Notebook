import React, { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";

const Workbooks = ({ onSelectWorkbook }) => {
  const [workbooks, setWorkbooks] = useState([]);

  // Fetch workbooks for the logged-in user
  const fetchWorkbooks = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(collection(db, "workbooks"), where("userId", "==", auth.currentUser.uid));
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

  // Function to delete a workbook
  const deleteWorkbook = async (workbookId) => {
    if (!window.confirm("Are you sure you want to delete this workbook?")) return;

    try {
      await deleteDoc(doc(db, "workbooks", workbookId));
      fetchWorkbooks(); // Refresh the list
    } catch (error) {
      console.error("Error deleting workbook:", error);
    }
  };

  useEffect(() => {
    fetchWorkbooks();
  }, []);

  return (
    <div>
      <h3>Existing Workbooks:</h3>
      <ul>
        {workbooks.map((wb) => (
          <li key={wb.id}>
            <span onClick={() => onSelectWorkbook(wb.id)}>{wb.name}</span>
            <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Workbooks;

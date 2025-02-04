import React, { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

const Workbooks = ({ onSelectWorkbook }) => {
  const [workbookName, setWorkbookName] = useState("");
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

  // Function to create a new workbook
  const createWorkbook = async () => {
    if (workbookName.trim() === "") {
      alert("Workbook name cannot be empty!");
      return;
    }

    try {
      await addDoc(collection(db, "workbooks"), {
        name: workbookName,
        userId: auth.currentUser.uid,
      });

      setWorkbookName("");
      fetchWorkbooks(); // Refresh the list
    } catch (error) {
      console.error("Error creating workbook:", error);
    }
  };

  useEffect(() => {
    fetchWorkbooks();
  }, [auth.currentUser]);

  return (
    <div>
      <h2>Your Workbooks</h2>
      <input
        type="text"
        placeholder="Enter workbook name"
        value={workbookName}
        onChange={(e) => setWorkbookName(e.target.value)}
      />
      <button onClick={createWorkbook}>Create Workbook</button>

      <h3>Existing Workbooks:</h3>
      <ul>
        {workbooks.map((wb) => (
          <li key={wb.id} onClick={() => onSelectWorkbook(wb.id)}>
            {wb.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Workbooks;

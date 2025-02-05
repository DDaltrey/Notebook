import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const Sidebar = ({
  user,
  onLogout,
  onSelectWorkbook,
  onSelectPage,
  selectedWorkbook,
  selectedPage,
  createWorkbook,
  createPage,
  deleteWorkbook,
  deletePage,
  workbooks,
}) => {
  const [showWorkbookInput, setShowWorkbookInput] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");

  const [showPageInput, setShowPageInput] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  const [recentNotes, setRecentNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allPages, setAllPages] = useState([]); // Store all pages for search

  useEffect(() => {
    if (selectedWorkbook && selectedPage) {
      fetchRecentNotes(selectedWorkbook, selectedPage);
    }
  }, [selectedWorkbook, selectedPage]);

  useEffect(() => {
    fetchAllPages(); // Load all pages on mount
  }, [workbooks]);

  const fetchRecentNotes = async (workbookId, pageId) => {
    try {
      const notesRef = collection(db, `workbooks/${workbookId}/pages/${pageId}/notes`);
      const q = query(notesRef, orderBy("lastModified", "desc"), limit(3));
      const querySnapshot = await getDocs(q);

      const notesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentNotes(notesArray);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
    }
  };

  const fetchAllPages = async () => {
    let pagesList = [];
    for (const wb of workbooks) {
      const pagesRef = collection(db, `workbooks/${wb.id}/pages`);
      const querySnapshot = await getDocs(pagesRef);
      const pages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        workbookId: wb.id,
        name: doc.data().name,
      }));
      pagesList = [...pagesList, ...pages];
    }
    setAllPages(pagesList);
  };

  const handleCreateWorkbook = () => {
    if (newWorkbookName.trim() !== "") {
      createWorkbook(newWorkbookName);
      setNewWorkbookName("");
      setShowWorkbookInput(false);
    }
  };

  const handleCreatePage = async () => {
    if (newPageName.trim() !== "" && selectedWorkbook) {
      await createPage(newPageName, selectedWorkbook); // Wait for Firestore to create page
      setNewPageName("");
      setShowPageInput(false);
      fetchAllPages(); // 🔥 Refresh page list immediately
    }
  };
  

  // **Filter workbooks & pages separately**
  const filteredWorkbooks = workbooks.filter((wb) =>
    wb.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPages = allPages.filter((pg) =>
    pg.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedWorkbook || pg.workbookId === selectedWorkbook) // Show only relevant pages
  );
  

  return (
    <div className="sidebar">
      {/* User Info Section */}
      {user && (
        <div className="user-info">
          <img src={user.photoURL} alt="User Avatar" className="avatar" />
          <div>
            <h3>{user.displayName}</h3>
            <p>{user.email}</p>
          </div>
        </div>
      )}
      <button className="danger-btn logout" onClick={onLogout}>Logout</button>

      

      {/* Search Bar with Clear Button */}
<div className="search-container">
  <input 
    type="text" 
    className="search-bar" 
    placeholder="Search workbooks or pages..." 
    value={searchTerm} 
    onChange={(e) => setSearchTerm(e.target.value)} 
  />
  {searchTerm && (
    <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
      ✖
    </button>
  )}
</div>


      {/* **Search Results Section** */}
      {searchTerm ? (
        <div className="search-results">
          <h4>Workbooks</h4>
          <ul>
            {filteredWorkbooks.length > 0 ? (
              filteredWorkbooks.map((wb) => (
                <li className="workbookList" key={wb.id}>
                  <div className="nameControls">
                    <h3 className="pageTitle" onClick={() => onSelectWorkbook(wb.id)}>
                      📒 {wb.name}
                    </h3>
                    <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>🗑</button>
                  </div>
                </li>
              ))
            ) : (
              <p>No workbooks found</p>
            )}
          </ul>

          <h4>Pages</h4>
          <ul>
            {filteredPages.length > 0 ? (
              filteredPages.map((pg) => (
                <li className="pageList" key={pg.id}>
                  <div className="nameControls">
                    <h3
                      className="pageTitle"
                      onClick={() => {
                        onSelectWorkbook(pg.workbookId); // Ensure workbook is selected first
                        onSelectPage(pg.id); // Then select the page
                      }}
                    >
                      📄 {pg.name}
                    </h3>
                    <button className="delete-btn" onClick={() => deletePage(pg.workbookId, pg.id)}>🗑</button>
                  </div>
                </li>
              ))
            ) : (
              <p>No pages found</p>
            )}
          </ul>
        </div>
      ) : !selectedWorkbook ? (
        <>
          {/* Workbooks Section */}
          <div className="section-header">
            <h1>Your Workbooks</h1>
            <button className="add-btn" onClick={() => setShowWorkbookInput(!showWorkbookInput)}>+</button>
          </div>

          {showWorkbookInput && (
            <div className="inline-input add-bookpage">
              <input
                type="text"
                value={newWorkbookName}
                onChange={(e) => setNewWorkbookName(e.target.value)}
                placeholder="Workbook Name"
              />
              <button className="confirm-btn" onClick={handleCreateWorkbook}>✔</button>
            </div>
          )}

          <ul>
            {workbooks.map((wb) => (
              <li className="workbookList" key={wb.id}>
                <div className="nameControls">
                  <h3 className="pageTitle" onClick={() => onSelectWorkbook(wb.id)}>{wb.name}</h3>
                  <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {/* Pages Section */}
          {/* Display selected workbook name */}
          {selectedWorkbook && (
  <div className="nameControls">
    <h2 className="selected-workbook-title">
      📂 {workbooks.find(wb => wb.id === selectedWorkbook)?.name}
      <button className="clear-workbook-btn" onClick={() => onSelectWorkbook(null)}>✖</button>
    </h2>
  </div>
)}


<div className="section-header">
  <h1>Pages</h1>
  <button className="add-btn" onClick={() => setShowPageInput(!showPageInput)}>+</button>
</div>

{showPageInput && (
  <div className="inline-input add-bookpage">
    <input
      type="text"
      value={newPageName}
      onChange={(e) => setNewPageName(e.target.value)}
      placeholder="Page Name"
    />
    <button className="confirm-btn" onClick={handleCreatePage}>✔</button>
  </div>
)}



          <ul>
            {filteredPages.map((pg) => (
              <li className="pageList" key={pg.id}>
                <div className="nameControls">
                📄 <h3 className="pageTitle" onClick={() => onSelectPage(pg.id)}>{pg.name}</h3>
                  <button className="delete-btn" onClick={() => deletePage(selectedWorkbook, pg.id)}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;

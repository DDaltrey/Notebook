import React, { useState } from "react";

const Sidebar = ({ 
  onLogout, 
  onSelectWorkbook, 
  onSelectPage, 
  selectedWorkbook, 
  createWorkbook, 
  createPage, 
  deleteWorkbook, 
  deletePage, 
  workbooks, 
  pages 
}) => {
  const [showWorkbookInput, setShowWorkbookInput] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");

  const [showPageInput, setShowPageInput] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  const handleCreateWorkbook = () => {
    if (newWorkbookName.trim() !== "") {
      createWorkbook(newWorkbookName);
      setNewWorkbookName("");
      setShowWorkbookInput(false);
    }
  };

  const handleCreatePage = () => {
    if (newPageName.trim() !== "" && selectedWorkbook) {
      createPage(newPageName, selectedWorkbook);
      setNewPageName("");
      setShowPageInput(false);
    }
  };

  return (
    <div className="sidebar">
      <h2>Evernote Clone</h2>
      <button className="danger-btn logout" onClick={onLogout}>Logout</button>

      <input type="text" className="search-bar" placeholder="Search notes..." />

      {!selectedWorkbook ? (
        <>
          <div className="section-header">
            <h3>Your Workbooks</h3>
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
              <li key={wb.id}>
                <span onClick={() => onSelectWorkbook(wb.id)}>{wb.name}</span>
                <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>🗑</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <button className="primary-btn" onClick={() => onSelectWorkbook(null)}>
            ← Back to Workbooks
          </button>

          <div className="section-header">
            <h3>Pages</h3>
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
            {pages.map((pg) => (
              <li key={pg.id}>
                <span onClick={() => onSelectPage(pg.id)}>{pg.name}</span>
                <button className="delete-btn" onClick={() => deletePage(selectedWorkbook, pg.id)}>🗑</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;

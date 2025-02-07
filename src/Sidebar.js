// Sidebar.js
import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";

const Sidebar = ({
  user,
  onLogout,
  workbooks,
  pages, // not used in this version
  fetchPages, // not used in this version
  createWorkbook,
  createPage,
  deleteWorkbook,
  deletePage,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the selected workbook id from the URL.
  // The expected URL is either "/workbook/:workbookId" or "/workbook/:workbookId/page/:pageId" etc.
  const pathParts = location.pathname.split("/");
  const selectedWorkbook = pathParts[1] === "workbook" && pathParts[2] ? pathParts[2] : null;

  const [showWorkbookInput, setShowWorkbookInput] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");

  const [showPageInput, setShowPageInput] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [allPages, setAllPages] = useState([]);

  // Fetch all pages from all workbooks (for search)
  useEffect(() => {
    fetchAllPages();
    // We run this when "workbooks" change.
  }, [workbooks]);

  const fetchAllPages = async () => {
    let pagesList = [];
    for (const wb of workbooks) {
      const pagesRef = collection(db, `workbooks/${wb.id}/pages`);
      const querySnapshot = await getDocs(pagesRef);
      const pagesArr = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        workbookId: wb.id,
        name: doc.data().name,
      }));
      pagesList = [...pagesList, ...pagesArr];
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
      await createPage(newPageName, selectedWorkbook);
      setNewPageName("");
      setShowPageInput(false);
      fetchAllPages();
      // Optionally, you can navigate to the new page once created.
    }
  };

  const handleDeletePage = async (wbId, pageId) => {
    await deletePage(wbId, pageId);
    fetchAllPages();
  };

  // Filter workbooks and pages based on the search term.
  const filteredWorkbooks = workbooks.filter((wb) =>
    wb.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPages = allPages.filter(
    (pg) =>
      pg.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedWorkbook || pg.workbookId === selectedWorkbook)
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
      <button className="danger-btn logout" onClick={onLogout}>
        Logout
      </button>

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

      {/* When searching, display filtered results */}
      {searchTerm ? (
        <div className="search-results">
          <h4>Workbooks</h4>
          <ul>
            {filteredWorkbooks.length > 0 ? (
              filteredWorkbooks.map((wb) => (
                <li key={wb.id} className="workbookList">
                  <div className="nameControls">
                    <h3
                      className="pageTitle"
                      onClick={() => navigate(`/workbook/${wb.id}`)}
                    >
                      📒 {wb.name}
                    </h3>
                    <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>
                      🗑
                    </button>
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
                <li key={pg.id} className="pageList">
                  <div className="nameControls">
                    <h3
                      className="pageTitle"
                      onClick={() =>
                        navigate(`/workbook/${pg.workbookId}/page/${pg.id}`)
                      }
                    >
                      📄 {pg.name}
                    </h3>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePage(pg.workbookId, pg.id)}
                    >
                      🗑
                    </button>
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
            <button className="add-btn" onClick={() => setShowWorkbookInput(!showWorkbookInput)}>
              +
            </button>
          </div>
          {showWorkbookInput && (
            <div className="inline-input add-bookpage">
              <input
                type="text"
                value={newWorkbookName}
                onChange={(e) => setNewWorkbookName(e.target.value)}
                placeholder="Workbook Name"
              />
              <button className="confirm-btn" onClick={handleCreateWorkbook}>
                ✔
              </button>
            </div>
          )}
          <ul>
            {workbooks.map((wb) => (
              <li key={wb.id} className="workbookList">
                <div className="nameControls">
                  <h3
                    className="pageTitle"
                    onClick={() => navigate(`/workbook/${wb.id}`)}
                  >
                    📒 {wb.name}
                  </h3>
                  <button className="delete-btn" onClick={() => deleteWorkbook(wb.id)}>
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {/* Pages Section */}
          {selectedWorkbook && (
            <div className="nameControls">
              <h2 className="selected-workbook-title">
                📂{" "}
                {workbooks.find((wb) => wb.id === selectedWorkbook)?.name}
                <button className="clear-workbook-btn" onClick={() => navigate("/")}>
                  ✖
                </button>
              </h2>
            </div>
          )}
          <div className="section-header">
            <h1>Pages</h1>
            <button className="add-btn" onClick={() => setShowPageInput(!showPageInput)}>
              +
            </button>
          </div>
          {showPageInput && (
            <div className="inline-input add-bookpage">
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="Page Name"
              />
              <button className="confirm-btn" onClick={handleCreatePage}>
                ✔
              </button>
            </div>
          )}
          <ul>
            {filteredPages.map((pg) => (
              <li key={pg.id} className="pageList">
                <div className="nameControls">
                  <h3
                    className="pageTitle"
                    onClick={() =>
                      navigate(`/workbook/${pg.workbookId}/page/${pg.id}`)
                    }
                  >
                    📄 {pg.name}
                  </h3>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePage(pg.workbookId, pg.id)}
                  >
                    🗑
                  </button>
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

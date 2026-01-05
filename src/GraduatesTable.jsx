import React, { useState, useEffect } from 'react';
import { getGraduates, deleteGraduate, migrateFromLocalStorage, createInitialData } from './firestoreService';
import './GraduatesTable.css';

const GraduatesTable = () => {
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [migrating, setMigrating] = useState(false);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const data = await getGraduates();
      setGraduates(data);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (firestoreId, name) => {
    if (!window.confirm(`Delete graduate "${name}"?`)) return;
    
    try {
      await deleteGraduate(firestoreId);
      // Update list after deletion
      setGraduates(graduates.filter(g => g.firestoreId !== firestoreId));
      alert(`✅ ${name} deleted successfully`);
    } catch (err) {
      alert(`❌ Failed to delete ${name}: ${err.message}`);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await migrateFromLocalStorage();
      
      if (result.migrated === 0 && result.total === 0) {
        alert("📭 No data found in localStorage to migrate.\nUse '➕ Initial Data' first.");
      } else if (result.migrated === 0) {
        alert("⚠️ All data already exists in Firestore (no duplicates added).");
      } else {
        alert(`✅ Successfully migrated ${result.migrated} records`);
        loadData(false);
      }
      
    } catch (err) {
      alert(`❌ Migration failed: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleCreateInitial = async () => {
    if (!window.confirm("Create initial data?\nWill be saved to localStorage first then Firestore.")) return;
    
    setLoading(true);
    try {
      await createInitialData();
      alert("✅ Initial data created successfully");
      loadData();
    } catch (err) {
      alert(`❌ Failed to create data: ${err.message}`);
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading graduate data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <h3>❌ Error Occurred</h3>
        <p>{error}</p>
        <button onClick={() => loadData()} className="btn btn-retry">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h2>📋 College Graduates List</h2>
      
      <div className="controls">
        <button onClick={() => loadData()} className="btn btn-refresh">
          🔄 Refresh List
        </button>
        <button onClick={handleMigrate} className="btn btn-migrate" disabled={migrating}>
          {migrating ? '⏳ Migrating...' : '📥 Migrate from localStorage'}
        </button>
        <button onClick={handleCreateInitial} className="btn btn-initial">
          ➕ Initial Data
        </button>
      </div>

      {/* 🔥 تم إزالة البطاقة هنا */}
      {/* <div className="firestore-info-card"> ... </div> */}

      <table className="graduates-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Name</th>
            <th>Department</th>
            <th>Year</th>
            <th>Grade</th>
            <th>Status (אישור)</th>
            <th>Actions (פעולות)</th>
          </tr>
        </thead>
        <tbody>
          {graduates.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-message">
                📭 No data available. Use control buttons to add data.
              </td>
            </tr>
          ) : (
            graduates.map((grad, index) => (
              <tr key={grad.firestoreId}>
                <td>{index + 1}</td>
                <td>{grad.code}</td>
                <td>{grad.name}</td>
                <td>{grad.department}</td>
                <td>{grad.year}</td>
                <td>{grad.grade}</td>
                <td>
                  {/* אישור (Approval) column */}
                  <span className={`status ${grad.status === "Approved" ? "approved" : "pending"}`}>
                    {grad.status === "Approved" ? "✅ Approved" : "⏳ Under Review"}
                  </span>
                </td>
                <td>
                  {/* פעולות (Actions) column */}
                  <div className="actions">
                    <button 
                      onClick={() => window.alert(`Edit: ${grad.name}\nFirestore ID: ${grad.firestoreId}`)}
                      className="action-btn edit-btn"
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(grad.firestoreId, grad.name)}
                      className="action-btn delete-btn"
                      title="Delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <small className="firestore-id">ID: {grad.firestoreId.substring(0, 8)}...</small>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="summary">
        <p>Total Graduates: <strong>{graduates.length}</strong></p>
        <p>
          Status: 
          <span className="approved-count"> {graduates.filter(g => g.status === "Approved").length} Approved</span> | 
          <span className="pending-count"> {graduates.filter(g => g.status !== "Approved").length} Under Review</span>
        </p>
      </div>
    </div>
  );
};

export default GraduatesTable;

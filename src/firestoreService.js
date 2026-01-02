import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "graduates";

/**
 * ============================================
 * How to Handle Firestore ID:
 * 
 * Decision: Firestore ID replaces the old id field
 * ============================================
 * 1. Firestore Document ID is the primary identifier (firestoreId)
 * 2. "code" field remains as metadata for old data reference
 * 3. No additional "id" field inside the document
 * 4. Original localStorage data is converted while preserving "code"
 * ============================================
 */

// 1. Get data from localStorage (original source)
const getDataFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('collegeGraduates');
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("No data in localStorage");
  }
  return [];
};

// 2. Add new graduate with data from localStorage
export const addGraduate = async (graduateData, fromLocalStorage = false) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      // Basic data
      code: graduateData.code,
      name: graduateData.name,
      department: graduateData.department,
      year: graduateData.year,
      grade: graduateData.grade,
      feedback: graduateData.feedback || '',
      
      // Status (in Arabic as in localStorage)
      status: graduateData.status || "Under Review",
      
      // Metadata
      fromLocalStorage: fromLocalStorage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("✅ Added successfully, Firestore ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding:", error);
    throw error;
  }
};

// 3. Get all graduates with time ordering
export const getGraduates = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    // 🔹 Important academic note:
    // Here we use Firestore ID as primary identifier (firestoreId)
    // We do NOT add an additional id field inside the document
    return snapshot.docs.map(doc => ({
      firestoreId: doc.id, // 🔹 Firestore ID is the primary identifier
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    throw error;
  }
};

// 4. Delete graduate using Firestore ID
export const deleteGraduate = async (firestoreId) => {
  try {
    if (!firestoreId) throw new Error("Invalid ID");
    
    await deleteDoc(doc(db, COLLECTION_NAME, firestoreId));
    console.log("✅ Deleted successfully:", firestoreId);
    return true;
  } catch (error) {
    console.error("❌ Error deleting:", error);
    throw error;
  }
};

// 5. Migrate data from localStorage to Firestore (as per requirements)
export const migrateFromLocalStorage = async () => {
  try {
    const localStorageData = getDataFromLocalStorage();
    
    if (localStorageData.length === 0) {
      console.log("📭 No data in localStorage to migrate");
      return { migrated: 0, total: 0 };
    }
    
    let migratedCount = 0;
    
    for (const graduate of localStorageData) {
      // 🔹 Academic note:
      // We use auto-generated Firestore ID
      // We keep the original code as metadata
      await addGraduate(graduate, true);
      migratedCount++;
    }
    
    console.log(`✅ Migrated ${migratedCount} records`);
    return { migrated: migratedCount, total: localStorageData.length };
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
};

// 6. Create initial test data (without localStorage)
export const createInitialData = async () => {
  // Initial data mimicking localStorage data
  const initialData = [
    {
      code: "20231001",
      name: "Ahmed Mohamed",
      department: "Computer Science",
      year: "2023",
      grade: "Excellent",
      status: "Approved",
      feedback: "Outstanding student in programming"
    },
    {
      code: "20231002",
      name: "Sara Abdullah",
      department: "Engineering",
      year: "2023",
      grade: "Very Good",
      status: "Under Review",
      feedback: "Excellent in projects"
    }
  ];
  
  try {
    // Store in localStorage first (as per requirements)
    localStorage.setItem('collegeGraduates', JSON.stringify(initialData));
    console.log("💾 Data saved to localStorage");
    
    // Then add to Firestore
    for (const data of initialData) {
      await addGraduate(data, false);
    }
    
    console.log("✅ Initial data created in Firestore");
  } catch (error) {
    console.error("❌ Error creating data:", error);
    throw error;
  }
};

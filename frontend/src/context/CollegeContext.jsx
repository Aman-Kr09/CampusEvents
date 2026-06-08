import React, { createContext, useContext, useState, useEffect } from 'react';

const CollegeContext = createContext();

export const CollegeProvider = ({ children }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('campusevents_selected_college');
    if (stored) {
      try {
        setSelectedCollege(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse selected college', err);
      }
    }
    setLoading(false);
  }, []);

  const selectCollege = (college) => {
    setSelectedCollege(college);
    localStorage.setItem('campusevents_selected_college', JSON.stringify(college));
  };

  const clearCollege = () => {
    setSelectedCollege(null);
    localStorage.removeItem('campusevents_selected_college');
  };

  return (
    <CollegeContext.Provider value={{ selectedCollege, selectCollege, clearCollege, loading }}>
      {children}
    </CollegeContext.Provider>
  );
};

export const useCollege = () => useContext(CollegeContext);

'use client';
import { createContext, useContext, useState } from 'react';

const BreadcrumbContext = createContext();

export function BreadcrumbProvider({ children }) {
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbItems, setBreadcrumbItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
}

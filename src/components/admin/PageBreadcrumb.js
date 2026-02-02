import React, { useEffect } from 'react';
import Link from 'next/link';
import { FaAngleRight } from 'react-icons/fa';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

/**
 * Reusable Breadcrumb Component
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items
 * Example: [
 *   { icon: <FaIcon />, label: 'Dashboard', href: '/admin/dashboard' },
 *   { label: 'Settings', href: '/admin/settings' },
 *   { label: 'Current Page' } // last item without href
 * ]
 */
export default function PageBreadcrumb({ items = [] }) {
  const { setBreadcrumbItems } = useBreadcrumb();
  
  useEffect(() => {
    // Set breadcrumb items ke context saat component mount
    setBreadcrumbItems(items);
    
    // Clear breadcrumb saat component unmount
    return () => setBreadcrumbItems([]);
  }, [items, setBreadcrumbItems]);

  // Component ini tidak render apa-apa, hanya set context
  return null;
  //     </nav>
  //   </div>
  // );
}

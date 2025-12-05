import React from 'react';
import Link from 'next/link';
import { FaAngleRight } from 'react-icons/fa';

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
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-600">
      <nav className="flex items-center" aria-label="Breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <div key={index} className="inline-flex items-center">
              {index > 0 && (
                <FaAngleRight className="mx-2 text-gray-500 text-xs" />
              )}
              
              {item.icon && (
                <span className={isLast ? "text-amber-300 mr-2" : "text-gray-400 mr-2"}>
                  {item.icon}
                </span>
              )}
              
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="text-sm font-medium text-gray-400 hover:text-amber-300 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-amber-300">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

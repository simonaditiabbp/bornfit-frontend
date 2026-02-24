import React from 'react';
import SearchInput from './SearchInput';
import ActionButton from './ActionButton';

/**
 * Reusable Page Header Component
 * Combines search input and action button in a flex layout
 * @param {Object} props
 * @param {string} props.searchPlaceholder - Search placeholder text
 * @param {string} props.searchValue - Search input value
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.actionHref - Action button link
 * @param {React.ReactNode} props.actionIcon - Action button icon
 * @param {string} props.actionText - Action button text
 */
export default function PageHeader({ 
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionHref,
  actionIcon,
  actionText,
  actionOnClick
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <SearchInput 
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
      />
      {(actionHref || actionOnClick) && (
        <ActionButton 
          href={actionHref}
          icon={actionIcon}
          onClick={actionOnClick}
        >
          {actionText}
        </ActionButton>
      )}
    </div>
  );
}

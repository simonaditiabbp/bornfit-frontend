import React from 'react';
import ActionButton from './ActionButton';

/**
 * Reusable Form Actions Component
 * Standard button layout for forms (Submit, Reset, Cancel)
 * @param {Object} props
 * @param {boolean} props.isEdit - Edit mode (shows Edit instead of Submit)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onReset - Reset handler
 * @param {string} props.cancelHref - Cancel button link
 * @param {boolean} props.isSubmitting - Submitting state
 */
export default function FormActions({ 
  isEdit = false,
  onSubmit,
  onReset,
  cancelHref,
  isSubmitting = false
}) {
  return (
    <div className="flex justify-start gap-3 mt-6">
      <ActionButton 
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {/* {isEdit ? 'Edit' : 'Submit'} */}
        {isSubmitting ? (isEdit ? 'Editing...' : 'Submitting...') : (isEdit ? 'Edit' : 'Submit')}
      </ActionButton>
      
      {onReset && (
        <ActionButton 
          type="reset"
          variant="secondary"
          onClick={onReset}
        >
          Reset
        </ActionButton>
      )}
      
      {cancelHref && (
        <ActionButton 
          href={cancelHref}
          variant="gray"
        >
          Cancel
        </ActionButton>
      )}
    </div>
  );
}

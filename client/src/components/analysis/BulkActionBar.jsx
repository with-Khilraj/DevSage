/**
 * Bulk Action Bar Component
 * Controls for bulk operations on selected suggestions
 */

import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button, Checkbox, Modal } from '../ui';

const BulkActionBar = ({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onBulkAction,
  onClearSelection,
  className = '',
  ...props
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Handle bulk action with confirmation
  const handleBulkAction = (action) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  // Confirm bulk action
  const confirmBulkAction = () => {
    if (pendingAction && onBulkAction) {
      onBulkAction(pendingAction);
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Cancel bulk action
  const cancelBulkAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Get action description
  const getActionDescription = (action) => {
    switch (action) {
      case 'accepted':
        return 'accept';
      case 'rejected':
        return 'reject';
      case 'applied':
        return 'apply';
      default:
        return action;
    }
  };

  // Get action color
  const getActionColor = (action) => {
    switch (action) {
      case 'accepted':
        return 'text-blue-400';
      case 'rejected':
        return 'text-red-400';
      case 'applied':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div
        className={twMerge(
          'flex items-center justify-between p-4 bg-blue-500/20 border-b border-blue-400/30 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              indeterminate={selectedCount > 0 && selectedCount < totalCount}
              onChange={(checked) => onSelectAll(checked)}
            />
            <span className="text-sm text-white font-medium">
              {selectedCount} of {totalCount} selected
            </span>
          </div>

          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-blue-200 hover:text-white"
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-200 mr-2">Bulk Actions:</span>
            
            <Button
              variant="success"
              size="sm"
              onClick={() => handleBulkAction('accepted')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Accept ({selectedCount})
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => handleBulkAction('rejected')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            >
              Reject ({selectedCount})
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleBulkAction('applied')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              Apply ({selectedCount})
            </Button>

            {/* Export Options */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Implement export functionality
                  console.log('Export selected suggestions:', selectedCount);
                }}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Export
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={cancelBulkAction}
        title="Confirm Bulk Action"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-2">
                {getActionDescription(pendingAction).charAt(0).toUpperCase() + getActionDescription(pendingAction).slice(1)} {selectedCount} suggestions?
              </h3>
              <p className="text-gray-300 text-sm">
                Are you sure you want to {getActionDescription(pendingAction)} {selectedCount} selected suggestion{selectedCount > 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Action Details */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">What will happen:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {pendingAction === 'accepted' && (
                <>
                  <li>• Suggestions will be marked as accepted</li>
                  <li>• They will remain visible for future reference</li>
                  <li>• You can still apply them later</li>
                </>
              )}
              {pendingAction === 'rejected' && (
                <>
                  <li>• Suggestions will be marked as rejected</li>
                  <li>• They will be hidden from the default view</li>
                  <li>• You can still view them in the rejected filter</li>
                </>
              )}
              {pendingAction === 'applied' && (
                <>
                  <li>• Suggestions will be marked as applied</li>
                  <li>• Code changes will be implemented</li>
                  <li>• This action modifies your code files</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={cancelBulkAction}
            >
              Cancel
            </Button>
            <Button
              variant={
                pendingAction === 'accepted' ? 'success' :
                pendingAction === 'rejected' ? 'danger' : 'primary'
              }
              onClick={confirmBulkAction}
              leftIcon={
                pendingAction === 'accepted' ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : pendingAction === 'rejected' ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            >
              {getActionDescription(pendingAction).charAt(0).toUpperCase() + getActionDescription(pendingAction).slice(1)} {selectedCount} Suggestion{selectedCount > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkActionBar;
import React from 'react';

const FileUploadModal = ({ show, onClose, onFileSelect, fileInputRef, selectedFile }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Select PDF File
        </h3>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={e => onFileSelect(e.target.files[0])}
        />
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => {
              onClose();
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.fileToProcess = null;
              }
            }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 
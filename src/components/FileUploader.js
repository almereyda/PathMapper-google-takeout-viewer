import React, { useRef } from 'react';

const FileUploader = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    onUpload(files);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".json"
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current.click()}>
        Upload Location History Files
      </button>
    </div>
  );
};

export default FileUploader;
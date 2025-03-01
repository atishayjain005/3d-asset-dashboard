import React, { useState } from 'react';
import axios from 'axios';

function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setError('');
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name);
    formData.append('tags', tags);

    try {
      await axios.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: event => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      });
      setIsUploading(false);
      setProgress(100);
      setFile(null);
      setName('');
      setTags('');
      onUploadSuccess();
    } catch (err) {
      console.error('Upload failed:', err);
      setIsUploading(false);
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileExtension = droppedFile.name.split('.').pop().toLowerCase();
      
      if (['glb', 'fbx', 'obj'].includes(fileExtension)) {
        setFile(droppedFile);
        if (!name) {
          setName(droppedFile.name.split('.')[0]);
        }
      } else {
        setError('Please upload a .glb, .fbx, or .obj file');
      }
    }
  };

  return (
    <form onSubmit={handleUpload} className="w-full">
      <h2 className="text-xl font-semibold text-white mb-4">Upload New Asset</h2>
      
      <div 
        className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-[#646cff] bg-[#646cff] bg-opacity-10' : 'border-[#333333]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between bg-[#333333] p-2 rounded">
            <div className="flex items-center">
              <div className="mr-2 text-[#646cff]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setFile(null)} 
              className="text-gray-400 hover:text-white p-1"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="text-gray-300 mb-2">Drag & drop a 3D file here</p>
            <p className="text-gray-500 text-sm mb-3">Supports GLB, FBX, OBJ</p>
            <label className="bg-[#333333] hover:bg-[#444444] text-white py-2 px-4 rounded cursor-pointer inline-block transition-colors">
              Browse Files
              <input 
                type="file" 
                className="hidden"
                accept=".glb,.fbx,.obj"
                onChange={e => {
                  const selectedFile = e.target.files[0];
                  if (selectedFile) {
                    setFile(selectedFile);
                    if (!name) {
                      setName(selectedFile.name.split('.')[0]);
                    }
                  }
                }}
              />
            </label>
          </>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-1">Asset Name:</label>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter asset name"
          className="w-full bg-[#333333] border border-[#444444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#646cff]"
          required 
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-1">Tags (comma-separated):</label>
        <input 
          type="text" 
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="e.g. furniture, chair, wood"
          className="w-full bg-[#333333] border border-[#444444] rounded px-3 py-2 text-white focus:outline-none focus:border-[#646cff]"
        />
      </div>
      
      {isUploading && (
        <div className="mb-4">
          <div className="h-2 bg-[#333333] rounded overflow-hidden">
            <div 
              className="h-2 bg-[#646cff] transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isUploading} 
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          isUploading 
            ? 'bg-[#444444] text-gray-300 cursor-not-allowed' 
            : 'bg-[#646cff] hover:bg-[#535bf2] text-white'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Asset'}
      </button>
    </form>
  );
}

export default UploadForm;
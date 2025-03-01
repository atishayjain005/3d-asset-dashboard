import React, { useState, useCallback, Suspense } from "react";
import UploadForm from "./UploadForm";
import ThreeDViewer from "./ThreeDViewer";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiX,
  FiChevronDown,
  FiClock,
  FiLoader,
} from "react-icons/fi";
import { FaEye, FaEdit, FaTrash, FaTags } from "react-icons/fa";
import { BiFile } from "react-icons/bi";

const API_BASE_URL = 'http://localhost:8080';

// Spinner component with customizable message
const Spinner = ({ message = "Loading assets..." }) => (
  <div className="flex flex-col items-center justify-center w-full h-64">
    <FiLoader className="w-8 h-8 text-[#646cff] animate-spin" />
    <p className="mt-4 text-gray-400">{message}</p>
  </div>
);

function Dashboard({ assets, setAssets, onPreview, onEdit, isLoading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tags: [],
    startDate: "",
    endDate: "",
    types: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Derive available tags and types from assets
  const availableTags = [...new Set(assets.flatMap((asset) => asset.tags || []))].sort();
  const availableTypes = [...new Set(assets.map((asset) => asset.type))].sort();

  // Helper: Check if any filters are active
  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.types.length > 0 ||
    filters.startDate !== "" ||
    filters.endDate !== "";

  const toggleFilter = () => setShowFilters(!showFilters);

  const handleTagFilter = useCallback((tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const handleTypeFilter = useCallback((type) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const clearFilters = () => {
    setFilters({
      tags: [],
      startDate: "",
      endDate: "",
      types: [],
    });
    setSearchTerm("");
  };

  // Filter assets based on search text, tags, type, and upload date range
  const filteredAssets = assets?.filter((asset) => {
    // Text search in name and tags
    const searchLower = searchTerm?.toLowerCase();
    const matchesSearch = 
      asset.name?.toLowerCase().includes(searchLower) ||
      asset.tags?.some(tag => tag?.toLowerCase().includes(searchLower)) ||
      false;

    const matchesTags =
      filters.tags.length === 0 ||
      (asset.tags && filters.tags.every((tag) => asset.tags.includes(tag)));

    const matchesType =
      filters.types.length === 0 || filters.types.includes(asset.type);

    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const assetDate = new Date(asset.uploaded_at || asset.uploadDate);
      
      if (filters.startDate) {
      const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (assetDate < startDate) matchesDate = false;
    }

      if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
        if (assetDate > endDate) matchesDate = false;
      }
    }

    return matchesSearch && matchesTags && matchesType && matchesDate;
  });

  const deleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      setDeleteLoading(id);
      const response = await fetch(`${API_BASE_URL}/assets/${id}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete asset. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Format date for display with proper timezone handling
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date available';
      
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Invalid date';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="w-screen min-h-screen bg-[#242424] text-white flex flex-col overflow-x-hidden">
      <header className="w-full bg-gradient-to-r from-[#371e75] to-[#2d1a5f] py-6 px-6 shadow-lg">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Asset Dashboard
        </h1>
        <p className="mt-2 text-gray-300">
          Manage and preview your 3D assets with ease
        </p>
      </header>

      <div className="flex flex-col md:flex-row w-full flex-1">
        <div className="w-full md:w-3/4 p-6 overflow-auto overflow-x-hidden">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by name or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-[#333333] border border-[#444444] rounded-lg focus:outline-none focus:border-[#646cff] text-white transition-all duration-200 placeholder-gray-500"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={toggleFilter}
              className={`px-4 py-2.5 flex items-center rounded-lg transition-all duration-200 ${
                hasActiveFilters
                  ? "bg-[#646cff] text-white shadow-lg shadow-[#646cff]/20"
                  : "bg-[#333333] text-gray-300 hover:bg-[#444444]"
              }`}
              disabled={isLoading}
            >
              <FiFilter className="mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {filters.tags.length + filters.types.length + (filters.startDate || filters.endDate ? 1 : 0)}
                </span>
              )}
              <FiChevronDown
                className={`ml-2 transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && !isLoading && (
            <div className="bg-gradient-to-b from-[#272727] to-[#1a1a1a] p-6 rounded-lg mb-6 border border-[#333333] shadow-lg transition-all duration-300 w-full max-w-full overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-[#646cff]">
                  Filter Assets
                </h3>
                {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                    className="text-sm text-gray-400 hover:text-white flex items-center px-3 py-1.5 rounded-md hover:bg-[#333333] transition-colors"
                >
                    <FiX className="mr-1.5" /> Clear all filters
                </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Tags Filter */}
                <div className="bg-[#1d1d1d] p-4 rounded-lg border border-[#333333] hover:border-[#444444] transition-colors">
                  <div className="flex items-center mb-3">
                    <FaTags className="mr-2 text-[#646cff]" />
                    <h4 className="font-medium">Tags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagFilter(tag)}
                        className={`text-xs rounded-full px-3 py-1.5 transition-all duration-200 ${
                          filters.tags.includes(tag)
                            ? "bg-[#646cff] text-white shadow-md shadow-[#646cff]/20"
                            : "bg-[#333333] text-gray-300 hover:bg-[#444444] hover:scale-105"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {availableTags.length === 0 && (
                      <span className="text-xs text-gray-400 italic">
                        No tags available
                      </span>
                    )}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="bg-[#1d1d1d] p-4 rounded-lg border border-[#333333] hover:border-[#444444] transition-colors">
                  <div className="flex items-center mb-3">
                    <BiFile className="mr-2 text-[#646cff]" />
                    <h4 className="font-medium">File Type</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeFilter(type)}
                        className={`text-xs rounded-full px-3 py-1.5 transition-all duration-200 ${
                          filters.types.includes(type)
                            ? "bg-[#646cff] text-white shadow-md shadow-[#646cff]/20"
                            : "bg-[#333333] text-gray-300 hover:bg-[#444444] hover:scale-105"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                    {availableTypes.length === 0 && (
                      <span className="text-xs text-gray-400 italic">
                        No types available
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload Date Filter */}
                <div className="bg-[#1d1d1d] p-4 rounded-lg border border-[#333333] hover:border-[#444444] transition-colors">
                  <div className="flex items-center mb-3">
                    <FiClock className="mr-2 text-[#646cff]" />
                    <h4 className="font-medium">Upload Date Range</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5 ml-1">
                        From:
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters({ ...filters, startDate: e.target.value })
                        }
                        className="w-full bg-[#333333] border border-[#444444] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5 ml-1">
                        To:
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters({ ...filters, endDate: e.target.value })
                        }
                        className="w-full bg-[#333333] border border-[#444444] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          {!isLoading && (
            <div className="mb-6 text-sm text-gray-400 flex items-center">
              <span className="bg-[#333333] px-3 py-1.5 rounded-full mr-2 font-medium">
              Showing {filteredAssets.length} of {assets.length} assets
            </span>
            {hasActiveFilters && (
                <span className="text-[#646cff] flex items-center">
                  <FiFilter className="mr-1.5" />
                  Filtered results
                </span>
            )}
          </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <Spinner />
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#333333]">
              <p className="text-gray-400">
                {assets.length === 0
                  ? "No assets found. Try uploading some!"
                  : "No assets match your search or filters."}
              </p>
              {assets.length > 0 && hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[#646cff] hover:text-[#535bf2] px-4 py-2 bg-[#2a2a2a] rounded-md hover:bg-[#333333] transition-all duration-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333333] hover:border-[#444444] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-black/30"
                >
                  <div className="relative">
                    {asset.type && ['glb', 'gltf', 'fbx', 'obj'].includes(asset.type.toLowerCase()) ? (
                      <Suspense fallback={
                        <div className="w-full h-32 bg-[#242424] rounded-t-lg overflow-hidden flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-[#646cff] border-t-transparent rounded-full animate-spin" />
                        </div>
                      }>
                        <ThreeDViewer 
                          asset={asset}
                          isThumbnail={true}
                          showControls={false}
                        />
                      </Suspense>
                    ) : (
                      <div className="w-full h-32 bg-[#242424] rounded-t-lg overflow-hidden flex items-center justify-center">
                        <BiFile className="w-12 h-12 text-[#646cff] opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[#646cff] bg-[#646cff]/10 rounded-full px-2.5 py-1 flex items-center">
                        <BiFile className="mr-1.5" />
                        {asset.type?.toUpperCase() || "FILE"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(asset.size)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2 truncate group-hover:text-[#646cff] transition-colors">
                      {asset.name}
                    </h3>

                    <div className="space-y-1.5">
                      <div className="text-xs text-gray-400 flex items-center">
                        <FiClock className="mr-1.5 text-[#646cff]" />
                        {formatDate(asset.uploaded_at || asset.uploadDate)}
                    </div>

                      {(asset.created_at || asset.createdAt) && (asset.created_at || asset.createdAt) !== (asset.uploaded_at || asset.uploadDate) && (
                        <div className="text-xs text-gray-400 flex items-center">
                          <FiCalendar className="mr-1.5 text-[#646cff]" />
                          Created: {formatDate(asset.created_at || asset.createdAt)}
                        </div>
                      )}
                    </div>

                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {asset.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-[#333333] text-gray-300 rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 border-t border-[#333333]">
                    <button
                      onClick={() => onPreview(asset)}
                      className="py-2.5 px-0 text-sm font-medium text-[#646cff] bg-[#1a1a1a] hover:bg-[#242424] transition-colors border-0 rounded-none flex items-center justify-center focus:outline-none focus-visible:bg-[#242424]"
                    >
                      <FaEye className="mr-1.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => onEdit(asset)}
                      className="py-2.5 px-0 text-sm font-medium text-green-400 bg-[#1a1a1a] hover:bg-[#242424] transition-colors border-l border-r border-0 border-l-[#333333] border-r-[#333333] hover:border-r-[#333333] hover:border-l-[#333333] flex items-center justify-center focus:outline-none focus-visible:bg-[#242424] rounded-none"
                    >
                      <FaEdit className="mr-1.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      disabled={deleteLoading === asset.id}
                      className="py-2.5 px-0 text-sm font-medium text-red-400 bg-[#1a1a1a] hover:bg-[#242424] transition-colors border-0 rounded-none flex items-center justify-center focus:outline-none focus-visible:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === asset.id ? (
                        <FiLoader className="animate-spin mr-1.5" />
                      ) : (
                        <FaTrash className="mr-1.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/4 bg-[#1a1a1a] p-6 border-l border-[#333333]">
          <UploadForm
            onUploadSuccess={(newAsset) => {
              // Optimistically update the UI
              const now = new Date().toISOString();
              const assetWithDate = {
                ...newAsset,
                uploaded_at: now,
                created_at: now
              };
              setAssets(prev => [assetWithDate, ...prev]);
              
              // Sync with server in the background
              onRefresh().catch(error => {
                console.error('Failed to sync with server:', error);
                // If sync fails, keep the optimistic update
                // The next refresh or page load will fix any inconsistencies
                });
            }}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

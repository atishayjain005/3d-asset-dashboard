import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import ThreeDViewer from "./components/ThreeDViewer";
import EditAssetModal from "./components/EditAssetModal";

const API_BASE_URL =
  "https://3d-asset-dashboard-ugql.vercel.app" || "http://localhost:8080";

function App() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch assets with loading state
  const fetchAssets = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/assets`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAssets(data);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      // setError("Failed to load assets. Please try again later.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsSyncing(false);
      }
    }
  };

  // Initial fetch with loading indicator
  useEffect(() => {
    fetchAssets(true);
  }, []);

  // Background sync without loading indicator
  const syncAssets = () => fetchAssets(false);

  // Update the asset list when an asset is edited
  const updateAsset = (updatedAsset) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset))
    );
    setEditAsset(null);

    // Sync with server in background
    syncAssets();
  };

  const handlePreview = (asset) => {
    setSelectedAsset(asset);
  };

  const handleEdit = (asset) => {
    setEditAsset(asset);
  };

  const handleClosePreview = () => {
    setSelectedAsset(null);
  };

  return (
    <div className="min-h-screen bg-[#242424]">
      {error ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg max-w-md text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => fetchAssets(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <Dashboard
            assets={assets}
            setAssets={setAssets}
            onPreview={handlePreview}
            onEdit={handleEdit}
            isLoading={isLoading}
            onRefresh={syncAssets}
            isSyncing={isSyncing}
          />
          {selectedAsset && (
            <ThreeDViewer asset={selectedAsset} onClose={handleClosePreview} />
          )}
          {editAsset && (
            <EditAssetModal
              asset={editAsset}
              onClose={() => setEditAsset(null)}
              onSave={updateAsset}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

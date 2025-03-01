import React, { useState } from 'react';

function EditAssetModal({ asset, onClose, onSave }) {
  const [name, setName] = useState(asset.name || '');
  const [tags, setTags] = useState(asset.tags ? asset.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveChanges = async () => {
    if (!name.trim()) {
      setError('Asset name cannot be empty');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tags: tags.split(',').filter(t => t.trim()).map(t => t.trim())
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }

      const updatedAsset = await res.json();
      onSave(updatedAsset);
    } catch (err) {
      console.error('Failed to update asset', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Asset</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-900 border border-red-800 text-red-200 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 font-medium">Name:</label>
          <input
            className="bg-gray-700 border border-gray-600 text-white rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Asset name"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">Tags:</label>
          <input
            className="bg-gray-700 border border-gray-600 text-white rounded p-2 w-full focus:outline-none focus-visible:outline-none"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Separate tags with commas"
            aria-label="Asset tags"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-200 hover:bg-gray-700"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            aria-label="Save changes"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAssetModal;

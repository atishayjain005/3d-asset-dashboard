export const SUPPORTED_MODEL_TYPES = ["glb", "gltf", "fbx", "obj"];
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const getAssetType = (filename = "") => {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.at(-1).toLowerCase();
};

export const isSupportedModelFile = (file) =>
  Boolean(file && SUPPORTED_MODEL_TYPES.includes(getAssetType(file.name)));

export const isWithinUploadLimit = (file) =>
  Boolean(file && file.size <= MAX_UPLOAD_BYTES);

export const supportedModelLabel = SUPPORTED_MODEL_TYPES.map((type) =>
  type.toUpperCase()
).join(", ");

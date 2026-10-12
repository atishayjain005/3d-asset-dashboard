export const SUPPORTED_MODEL_TYPES = new Set(["glb", "gltf", "fbx", "obj"]);
export const MAX_ASSET_NAME_LENGTH = 120;
export const MAX_TAG_LENGTH = 40;
export const MAX_TAGS = 12;

export const getExtension = (filename = "") => {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.at(-1).toLowerCase();
};

export const validateAssetType = (filename) => {
  const ext = getExtension(filename);
  return SUPPORTED_MODEL_TYPES.has(ext) ? ext : "";
};

export const normalizeAssetName = (name, fallbackName = "") => {
  const source = typeof name === "string" && name.trim() ? name : fallbackName;
  const normalized = source.trim().replace(/\s+/g, " ");
  return normalized.slice(0, MAX_ASSET_NAME_LENGTH);
};

export const normalizeTags = (tags = "") => {
  const values = Array.isArray(tags) ? tags : String(tags).split(",");
  const seen = new Set();

  return values
    .map((tag) => String(tag).trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_TAGS)
    .map((tag) => tag.slice(0, MAX_TAG_LENGTH));
};

export const sanitizeFileName = (filename = "") =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);

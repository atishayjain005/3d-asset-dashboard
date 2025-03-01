// index.js
import express from "express";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize storage bucket
const initBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const assetsBucket = buckets?.find(bucket => bucket.name === 'assets');
  if (!assetsBucket) {
    const { data, error } = await supabase.storage.createBucket('assets', {
      public: true,
      fileSizeLimit: 52428800 // 50MB in bytes
    });
    if (error) console.error('Error creating bucket:', error);
    else console.log('Assets bucket created successfully');
  }
};
initBucket();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // limit files to 50 MB (adjust as needed)
  fileFilter: (req, file, cb) => {
    // Only allow .glb, .fbx, .obj file types
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (["glb", "gltf", "fbx", "obj"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_TYPE")); // reject file
    }
  },
});

// POST /assets - Upload a new 3D asset
app.post("/assets", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      // No file provided
      throw new Error("FILE_MISSING");
    }
    const file = req.file;
    const { name, tags = "" } = req.body;
    const ext = file.originalname.split(".").pop().toLowerCase();

    // 1. Upload file to Supabase Storage
    const filePath = `${Date.now()}_${file.originalname}`; // unique file path/name in bucket
    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      throw uploadError;
    }

    // 2. Construct public URL for the uploaded file
    const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // 3. Insert metadata into Database
    const { error: dbError, data: newEntry } = await supabase
      .from("assets")
      .insert({
        name: name,
        file_url: publicUrl,
        type: ext,
        size: file.size,
        tags: tags ? tags.split(",").map((t) => t.trim()) : null,
      })
      .select()
      .single(); // .single() to return the inserted row
    if (dbError) {
      throw dbError;
    }

    // 4. Respond with the new asset record
    res.status(201).json(newEntry);
  } catch (err) {
    next(err); // pass errors to error handler
  }
});

// GET /assets - Fetch all assets (with optional query filtering)
app.get("/assets", async (req, res, next) => {
  try {
    const { search, type } = req.query;
    let query = supabase
      .from("assets")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (search) {
      // Filter name or tags by search term (case-insensitive)
      query = query.ilike("name", `%${search}%`); // filter name contains search&#8203;:contentReference[oaicite:7]{index=7}
      // Optionally, also filter tags if needed (Supabase can filter array via contains or text search)
    }
    if (type) {
      query = query.eq("type", type);
    }
    const { data: assets, error } = await query;
    if (error) throw error;
    res.json(assets);
  } catch (err) {
    next(err);
  }
});

// PUT /assets/:id - Update asset metadata
app.put("/assets/:id", async (req, res, next) => {
  try {
    const assetId = req.params.id;
    const updates = req.body; // e.g., { name: "New Name", tags: ["tag1","tag2"] }
    const { data: updated, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", assetId)
      .select()
      .single();
    if (error) throw error;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /assets/:id - Delete an asset (file + record)
app.delete("/assets/:id", async (req, res, next) => {
  try {
    const assetId = req.params.id;
    // First, find the asset to get file path or URL
    const { data: asset, error: findError } = await supabase
      .from("assets")
      .select("file_url")
      .eq("id", assetId)
      .single();
    if (findError) throw findError;
    if (!asset) {
      return res.status(404).send("Asset not found");
    }
    // Derive storage path from the file URL. If public URL, remove the fixed parts to get path.
    const fileUrl = asset.file_url;
    const pathInBucket = fileUrl.split("/storage/v1/object/public/assets/")[1]; // assuming public URL format
    // Remove the file from storage
    const { error: removeError } = await supabase.storage
      .from("assets")
      .remove([pathInBucket]);
    if (removeError) throw removeError;
    // Remove the record from DB
    const { error: dbError } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId);
    if (dbError) throw dbError;
    res.status(204).send(); // success, no content
  } catch (err) {
    next(err);
  }
});

// Error handling middleware (should be defined last, after other app.use/route calls)
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    // Multer-specific errors (file too large, etc.)
    return res.status(400).json({ error: err.code });
  } else if (err.message === "FILE_MISSING" || err.message === "INVALID_TYPE") {
    // Custom errors from our checks
    return res.status(400).json({ error: err.message });
  } else {
    // Generic server error
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

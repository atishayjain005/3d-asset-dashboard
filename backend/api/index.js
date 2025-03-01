// index.js
import express from "express";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Configure CORS to allow your frontend domain
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://3d-asset-dashboard.vercel.app",
  })
);

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize storage bucket
const initBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const assetsBucket = buckets?.find((bucket) => bucket.name === "assets");
  if (!assetsBucket) {
    const { data, error } = await supabase.storage.createBucket("assets", {
      public: true,
      fileSizeLimit: 52428800, // 50MB in bytes
    });
    if (error) console.error("Error creating bucket:", error);
    else console.log("Assets bucket created successfully");
  }
};
initBucket();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter: (req, file, cb) => {
    // Only allow .glb, .fbx, .obj file types
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (["glb", "gltf", "fbx", "obj"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_TYPE"));
    }
  },
});

// POST /assets - Upload a new 3D asset
app.post("/assets", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("FILE_MISSING");
    }
    const file = req.file;
    const { name, tags = "" } = req.body;
    const ext = file.originalname.split(".").pop().toLowerCase();

    // 1. Upload file to Supabase Storage
    const filePath = `${Date.now()}_${file.originalname}`;
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
      .single();
    if (dbError) {
      throw dbError;
    }

    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
  }
});

// GET /assets - Fetch all assets
app.get("/assets", async (req, res, next) => {
  try {
    const { search, type } = req.query;
    let query = supabase.from("assets").select("*").order("uploaded_at", {
      ascending: false,
    });
    if (search) {
      query = query.ilike("name", `%${search}%`);
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
    const updates = req.body;
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
    const { data: asset, error: findError } = await supabase
      .from("assets")
      .select("file_url")
      .eq("id", assetId)
      .single();
    if (findError) throw findError;
    if (!asset) {
      return res.status(404).send("Asset not found");
    }
    const fileUrl = asset.file_url;
    const pathInBucket = fileUrl.split(
      "/storage/v1/object/public/assets/"
    )[1];
    const { error: removeError } = await supabase.storage
      .from("assets")
      .remove([pathInBucket]);
    if (removeError) throw removeError;
    const { error: dbError } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId);
    if (dbError) throw dbError;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code });
  } else if (
    err.message === "FILE_MISSING" ||
    err.message === "INVALID_TYPE"
  ) {
    return res.status(400).json({ error: err.message });
  } else {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// For local development only. When deployed on Vercel, Vercel will import the app.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

export default app;

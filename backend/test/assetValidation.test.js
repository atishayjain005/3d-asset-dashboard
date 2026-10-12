import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ASSET_NAME_LENGTH,
  normalizeAssetName,
  normalizeTags,
  sanitizeFileName,
  validateAssetType,
} from "../api/assetValidation.js";

test("validates supported 3D model file extensions", () => {
  assert.equal(validateAssetType("chair.GLB"), "glb");
  assert.equal(validateAssetType("scene.gltf"), "gltf");
  assert.equal(validateAssetType("mesh.fbx"), "fbx");
  assert.equal(validateAssetType("scan.obj"), "obj");
  assert.equal(validateAssetType("poster.png"), "");
  assert.equal(validateAssetType("asset"), "");
});

test("normalizes asset names with a safe fallback and length cap", () => {
  assert.equal(normalizeAssetName("  Render   Ready  Chair  "), "Render Ready Chair");
  assert.equal(normalizeAssetName("", "fallback.glb"), "fallback.glb");

  const longName = "x".repeat(MAX_ASSET_NAME_LENGTH + 20);
  assert.equal(normalizeAssetName(longName).length, MAX_ASSET_NAME_LENGTH);
});

test("normalizes tag lists by trimming, deduplicating, and capping length", () => {
  assert.deepEqual(normalizeTags(" chair, Wood, chair, , office  desk "), [
    "chair",
    "Wood",
    "office desk",
  ]);

  const longTag = "x".repeat(80);
  assert.equal(normalizeTags([longTag])[0].length, 40);
  assert.equal(normalizeTags(Array.from({ length: 20 }, (_, index) => `t${index}`)).length, 12);
});

test("sanitizes storage filenames without leaking unsafe characters", () => {
  assert.equal(sanitizeFileName("chair render final!.glb"), "chair_render_final_.glb");
  assert.equal(sanitizeFileName("../secret.obj"), ".._secret.obj");
});

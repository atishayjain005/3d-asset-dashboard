import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../api/index.js";

test("health reports API status without requiring Supabase credentials", async () => {
  const response = await request(app).get("/health").expect(200);

  assert.equal(response.body.ok, true);
  assert.equal(response.body.storageBucket, "assets");
  assert.equal(response.body.supabaseConfigured, false);
});

test("asset routes return a clear setup error when Supabase is not configured", async () => {
  const response = await request(app).get("/assets").expect(503);

  assert.equal(response.body.error, "SUPABASE_NOT_CONFIGURED");
});

test("unexpected browser origins are rejected", async () => {
  const response = await request(app)
    .get("/health")
    .set("Origin", "https://unexpected.example")
    .expect(403);

  assert.equal(response.body.error, "CORS_NOT_ALLOWED");
});

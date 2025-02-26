import { Hono, Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a Hono app WITHOUT a basePath (it will be mounted later)
const crudApp = new Hono({ strict: false });

/*
  ============================================================
  USERS CRUD endpoints
  ============================================================
*/

// Get all users
crudApp.get("/users", async (c: Context) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Get one user by id
crudApp.get("/users/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase.from("users").select("*").eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  const user = data && data.length > 0 ? data[0] : {};
  return c.json(user);
});

// Create a new user
crudApp.post("/users", async (c: Context) => {
  const body = await c.req.json();
  // Set default values for email if it is missing
  body.email = body.email || "";

  // Set referral_code to be the same as external_id if not provided
  if (!body.referral_code && body.external_id) {
    body.referral_code = body.external_id;
  }
  body.referral_code = body.referral_code || "";
  body.email = !body.email ? uuidv4() + "@example.com" : body.email;
  console.log(body);
  const { data, error } = await supabase.from("users").insert(body);
  console.log(error);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Update a user by id
crudApp.put("/users/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("users")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Delete a user by id
crudApp.delete("/users/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  USER_REFERRALS CRUD endpoints
  ============================================================
*/

// List all user referral records
crudApp.get("/referrals", async (c: Context) => {
  const { data, error } = await supabase.from("user_referrals").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Get a referral record by id
crudApp.get("/referrals/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("user_referrals")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});

// Create a referral record
crudApp.post("/referrals", async (c: Context) => {
  const body = await c.req.json();
  // Expected body: { referrer_id: number, referee_id: number }
  const { data, error } = await supabase.from("user_referrals").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Update a referral record by id
crudApp.put("/referrals/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("user_referrals")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

// Delete a referral record by id
crudApp.delete("/referrals/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("user_referrals")
    .delete()
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  USER_POINTS_HISTORY CRUD endpoints
  ============================================================
*/

crudApp.get("/points-history", async (c: Context) => {
  const { data, error } = await supabase
    .from("user_points_history")
    .select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

crudApp.post("/points-history", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("user_points_history")
    .insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  PREORDERS CRUD endpoints
  ============================================================
*/

crudApp.get("/preorders", async (c: Context) => {
  const { data, error } = await supabase.from("preorders").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/preorders/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("preorders")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/preorders", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("preorders").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/preorders/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("preorders")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/preorders/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("preorders")
    .delete()
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  QUESTS CRUD endpoints
  ============================================================
*/

crudApp.get("/quests", async (c: Context) => {
  const { data, error } = await supabase.from("quests").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/quests", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("quests").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("quests")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase.from("quests").delete().eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  USER_QUESTS CRUD endpoints
  ============================================================
*/

crudApp.get("/user-quests", async (c: Context) => {
  const { data, error } = await supabase.from("user_quests").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/user-quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("user_quests")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/user-quests", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("user_quests").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/user-quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("user_quests")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/user-quests/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("user_quests")
    .delete()
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  USER KYC CRUD endpoints
  ============================================================
*/

crudApp.get("/kyc", async (c: Context) => {
  const { data, error } = await supabase.from("user_kyc").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/kyc/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("user_kyc")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/kyc", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("user_kyc").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/kyc/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("user_kyc")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/kyc/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase.from("user_kyc").delete().eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  CARD ISSUANCE CRUD endpoints
  ============================================================
*/

crudApp.get("/card-issuance", async (c: Context) => {
  const { data, error } = await supabase.from("card_issuance").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/card-issuance/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("card_issuance")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/card-issuance", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("card_issuance").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/card-issuance/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("card_issuance")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/card-issuance/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("card_issuance")
    .delete()
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

/*
  ============================================================
  CARD MANAGEMENT CRUD endpoints
  ============================================================
*/

crudApp.get("/card-management", async (c: Context) => {
  const { data, error } = await supabase.from("card_management").select("*");
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.get("/card-management/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("card_management")
    .select("*")
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data[0] || {});
});
crudApp.post("/card-management", async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("card_management").insert(body);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.put("/card-management/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("card_management")
    .update(body)
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});
crudApp.delete("/card-management/:id", async (c: Context) => {
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("card_management")
    .delete()
    .eq("id", id);
  if (error) throw new HTTPException(500, { message: error.message });
  return c.json(data);
});

export default crudApp;

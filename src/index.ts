import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
dotenv.config();

// Import your CRUD router and other services
import crudApp from "./server/crud_handler";
import { AppHandler } from "./server/handler";
import { RegisterService } from "./service/register_service";
import { ReferralService } from "./service/referral_service";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./db/types/supabase";

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Create instances of your service classes`
const registerService = new RegisterService();
const referralService = new ReferralService(supabase);

// Create an instance of the application handler
const appHandler = new AppHandler(registerService, referralService);

// Create the main Hono app with basePath "/api"
const app = new Hono({ strict: false }).basePath("/api");

// Add middleware
app.use(logger());
app.use(
  cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE", "PUT"],
    exposeHeaders: ["*"],
    maxAge: 600,
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (c) => {
  return c.text("healthy");
});

// Mount the CRUD router
app.route("/", crudApp);

// Mount the AppHandler routes
app.route("/", appHandler.getApp());

// Server configuration
const port = parseInt(process.env.PORT || "3000");

// Start the server
serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);

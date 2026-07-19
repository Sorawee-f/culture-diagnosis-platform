import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(20),
  SURVEY_VERSION: z.string().default("2026-pilot-v4"),
  MIN_GROUP_SIZE: z.coerce.number().int().min(1).default(7),
  PROTOTYPE_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  SURVEY_VERSION: process.env.SURVEY_VERSION ?? "2026-pilot-v4",
  MIN_GROUP_SIZE: process.env.MIN_GROUP_SIZE ?? "7",
  PROTOTYPE_MODE: process.env.PROTOTYPE_MODE ?? "false",
});

export const effectiveMinGroupSize = env.PROTOTYPE_MODE ? 1 : env.MIN_GROUP_SIZE;

import z from "zod";

const configSchema = z.object({
  OAUTH_CLIENT_ID: z.string(),
  OAUTH_CLIENT_SECRET: z.string(),
  OAUTH_REDIRECT_URL: z.string().url(),

  SESSION_SECRET: z.string().transform((key) => Buffer.from(key, "hex")),
  SESSION_COOKIE_NAME: z.string().default("chatgpt-fitbit-bridge-session"),
  SESSION_COOKIE_FORCE_SECURE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
});

export type ServerConfig = z.infer<typeof configSchema>;

export function getConfig() {
  return configSchema.parse(process.env, { path: ["Environment variables"] });
}

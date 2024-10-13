import pkceChallenge from "pkce-challenge";
import { nanoid } from "nanoid";
import { getConfig } from "../config";
import axios from "axios";
import { z } from "zod";
import { addSeconds } from "date-fns";

export async function beginLogin() {
  const { code_challenge, code_verifier, state } = await prepareLogin();

  const config = getConfig();

  const loginUrl = new URL("https://www.fitbit.com/oauth2/authorize");
  loginUrl.searchParams.append("response_type", "code");
  loginUrl.searchParams.append("client_id", config.OAUTH_CLIENT_ID);
  loginUrl.searchParams.append("scope", "nutrition profile");
  loginUrl.searchParams.append("code_challenge", code_challenge);
  loginUrl.searchParams.append("code_challenge_method", "S256");
  loginUrl.searchParams.append("state", state);
  loginUrl.searchParams.append("redirect_uri", config.OAUTH_REDIRECT_URL);

  return { state, code_verifier, loginUrl: loginUrl.toString() };
}

export async function prepareLogin() {
  const challenge = await pkceChallenge();
  const state = nanoid();

  return { ...challenge, state };
}

export const tokenSetSchema = z
  .object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string(),
    token_type: z.string(),
    user_id: z.string(),
  })
  .transform((tokenSet) => ({
    ...tokenSet,
    expiresAt: addSeconds(new Date(), tokenSet.expires_in).toISOString(),
  }));

export type TokenSet = z.infer<typeof tokenSetSchema>;

export async function getTokenSet(code_verifier: string, code: string) {
  const config = getConfig();
  const basicAuth = Buffer.from(
    `${config.OAUTH_CLIENT_ID}:${config.OAUTH_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await axios.post(
    "https://api.fitbit.com/oauth2/token",
    {
      client_id: config.OAUTH_CLIENT_ID,
      grant_type: "authorization_code",
      redirect_uri: config.OAUTH_REDIRECT_URL,
      code,
      code_verifier,
    },
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return tokenSetSchema.parse(resp.data);
}

export async function refreshTokenSet(refresh_token: string) {
  const config = getConfig();
  const basicAuth = Buffer.from(
    `${config.OAUTH_CLIENT_ID}:${config.OAUTH_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await axios.post(
    "https://api.fitbit.com/oauth2/token",
    {
      grant_type: "refresh_token",
      client_id: config.OAUTH_CLIENT_ID,
      refresh_token,
    },
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return tokenSetSchema.parse(resp.data);
}

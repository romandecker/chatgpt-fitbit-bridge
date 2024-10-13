import { serialize } from "cookie";
import crypto from "crypto";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { z } from "zod";
import { getConfig } from "./config";
import { tokenSetSchema } from "./auth/auth";

const algorithm = "aes-256-gcm";

const sessionDataSchema = z.string().transform((str) =>
  z
    .object({
      state: z.string().optional(),
      code_verifier: z.string().optional(),
      postLoginReturnUrl: z.string().optional(),
      tokenSet: tokenSetSchema.optional(),
    })
    .parse(JSON.parse(str))
);

export type SessionData = z.infer<typeof sessionDataSchema>;

const encryptedSessionDataSchema = z.string().transform((str) =>
  z
    .object({
      iv: z.string(),
      authTag: z.string(),
      data: z.string(),
    })
    .parse(JSON.parse(str))
);

type EncryptedSessionData = z.infer<typeof encryptedSessionDataSchema>;

export function encryptSession(session: SessionData) {
  const raw = JSON.stringify(session);
  const config = getConfig();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, config.SESSION_SECRET, iv);
  const encrypted: EncryptedSessionData = {
    data: Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]).toString(
      "base64"
    ),
    authTag: cipher.getAuthTag().toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
  };
  return JSON.stringify(encrypted);
}

export function decryptSession(encrypted: string) {
  const config = getConfig();
  const { authTag, data, iv } = encryptedSessionDataSchema.parse(encrypted);
  const decipher = crypto.createDecipheriv(
    algorithm,
    config.SESSION_SECRET,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]);

  return sessionDataSchema.parse(decrypted.toString("utf-8"));
}

export async function getSession() {}

interface Session {
  data: SessionData;
  save: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSession<P extends { [key: string]: any }>(
  getServerSideProps: (
    ctx: GetServerSidePropsContext & { session: Session }
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  const config = getConfig();
  return async (ctx) => {
    const raw = ctx.req.cookies[config.SESSION_COOKIE_NAME];
    const sessionData = raw ? decryptSession(raw) : {};

    const session: Session = {
      data: sessionData,
      save: function () {
        const cookie = formatSessionCookie(this.data);
        ctx.res.setHeader("Set-Cookie", cookie);
      },
    };

    return getServerSideProps({ ...ctx, session });
  };
}

export function formatSessionCookie(data: SessionData) {
  const config = getConfig();
  return serialize(config.SESSION_COOKIE_NAME, encryptSession(data), {
    httpOnly: true,
    secure: config.SESSION_COOKIE_FORCE_SECURE,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getConfig } from "../../../config";
import { decryptSession, formatSessionCookie } from "../../../session";
import { getTokenSet } from "../../../auth/auth";

const querySchema = z.object({
  code: z.string(),
  state: z.string(),
});

export default async function authCallback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const config = getConfig();
  const sessionCookie = req.cookies[config.SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    return res.status(412).json({
      message: "This must be called after returning from oauth provider",
    });
  }

  const session = decryptSession(sessionCookie);
  if (!session.code_verifier) {
    return res.status(412).json({
      message: "Missing code_verifier",
    });
  }

  const { code, state } = querySchema.parse(req.query);
  if (session.state !== state) {
    return res.status(403).json({
      message: "Invalid state",
    });
  }
  session.tokenSet = await getTokenSet(session.code_verifier, code);
  res.setHeader("Set-Cookie", formatSessionCookie(session));

  res.redirect(session.postLoginReturnUrl || "/");
}

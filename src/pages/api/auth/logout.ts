import { NextApiRequest, NextApiResponse } from "next";
import { formatSessionCookie } from "../../../session";
import { z } from "zod";

const querySchema = z.object({ returnTo: z.string() });

export default async function authCallback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { returnTo } = querySchema.parse(req.query, {
    path: ["query parameters"],
  });

  res.setHeader("Set-Cookie", formatSessionCookie({}));
  res.redirect(returnTo);
}

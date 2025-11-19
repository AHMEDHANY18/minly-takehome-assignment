import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../dist/app";

// Express app أصلاً عبارة عن function (req, res, next),
// فنقدر نناديه مباشرة
export default (req: VercelRequest, res: VercelResponse) => {
  return (app as any)(req, res);
};

import type { Request, Response } from "express";
import { mustEnv } from "../../utilities/authCookies";
import { clearAuthCookies } from "./cookies/authCookies";
import { buildCognitoLogoutUrl } from "./cognito/cognito.logout";

export async function logout(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const logoutRedirect = mustEnv("COGNITO_LOGOUT_REDIRECT_URI");

  clearAuthCookies(res);

  const url = buildCognitoLogoutUrl({ domain, clientId, logoutRedirect });
  return res.redirect(url);
}

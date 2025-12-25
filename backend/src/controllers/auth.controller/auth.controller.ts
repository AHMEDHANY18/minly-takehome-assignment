import type { Request, Response } from "express";
import { startLogin } from "../../services/auth/auth-login.service";
import { handleCallback } from "../../services/auth/auth-callback.service";
import { refresh } from "../../services/auth/auth-refresh.service";
import { logout } from "../../services/auth/auth-logout.service";

export async function cognitoLogin(req: Request, res: Response) {
  return startLogin(req, res);
}

export async function cognitoCallback(req: Request, res: Response) {
  return handleCallback(req, res);
}

export async function authRefresh(req: Request, res: Response) {
  return refresh(req, res);
}

export async function authLogout(req: Request, res: Response) {
  return logout(req, res);
}

export async function authMe(req: Request, res: Response) {
  return res.json({ user: req.user });
}

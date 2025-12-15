import type { AxiosResponse } from "axios";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { api } from "./axios";
import type { User } from "../store/user.store";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type Tokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
});

function setTokens(t: Tokens) {
  localStorage.setItem("accessToken", t.accessToken);
  localStorage.setItem("idToken", t.idToken);
  localStorage.setItem("refreshToken", t.refreshToken);
  // legacy
  localStorage.setItem("token", t.accessToken);
}

export const AuthAPI = {
  signUp: (data: { name: string; email: string; password: string }) => {
    const attrs: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: "email", Value: data.email }),
    ];
    if (data.name?.trim()) {
      attrs.push(new CognitoUserAttribute({ Name: "name", Value: data.name.trim() }));
    }

    return new Promise<{ userSub?: string; userConfirmed?: boolean }>((resolve, reject) => {
      pool.signUp(data.email, data.password, attrs, [], (err, result) => {
        if (err) return reject(err);
        resolve({ userSub: result?.userSub, userConfirmed: result?.userConfirmed });
      });
    });
  },

  signIn: (data: LoginPayload) => {
    const auth = new AuthenticationDetails({
      Username: data.email,
      Password: data.password,
    });

    const user = new CognitoUser({
      Username: data.email,
      Pool: pool,
    });

    return new Promise<Tokens>((resolve, reject) => {
      user.authenticateUser(auth, {
        onSuccess: (session) => {
          resolve({
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
          });
        },
        onFailure: reject,
      });
    });
  },

  getMe: (): Promise<AxiosResponse<any>> => api.get("/users/me/profile"),

  loginAndLoadUser: async (payload: LoginPayload): Promise<User> => {
    const tokens = await AuthAPI.signIn(payload);
    setTokens(tokens);

    const meRes = await AuthAPI.getMe();
    const user =
      meRes.data?.data?.user ??
      meRes.data?.user ??
      meRes.data?.data ??
      null;

    if (!user) throw new Error("Profile response shape is unexpected.");
    return user as User;
  },
};

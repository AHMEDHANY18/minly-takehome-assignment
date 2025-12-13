import axios from "axios";
import qs from "qs";
import { cognitoConfig } from "../../../config/cognito";

export async function exchangeCodeWithCognito(code: string) {
  const basicAuth = Buffer.from(
    `${cognitoConfig.clientId}:${cognitoConfig.clientSecret}`
  ).toString("base64");

  const { data } = await axios.post(
    `${cognitoConfig.domain}/oauth2/token`,
    qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: cognitoConfig.callbackUrl,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  return data;
}

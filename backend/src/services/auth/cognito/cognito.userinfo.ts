import axios from "axios";

export async function cognitoUserInfo(args: { domain: string; accessToken: string }) {
  const { data } = await axios.get(`${args.domain}/oauth2/userInfo`, {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  return data as any;
}

export const cognitoConfig = {
    domain: process.env.COGNITO_DOMAIN!,
    clientId: process.env.COGNITO_CLIENT_ID!,
    clientSecret: process.env.COGNITO_CLIENT_SECRET!,
    callbackUrl: process.env.COGNITO_CALLBACK_URL!,
    jwksUrl: process.env.COGNITO_JWKS_URL!,
    region: process.env.COGNITO_REGION!,
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
  };

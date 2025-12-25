export function buildCognitoLogoutUrl(args: {
    domain: string;
    clientId: string;
    logoutRedirect: string;
  }) {
    return (
      `${args.domain}/logout` +
      `?client_id=${encodeURIComponent(args.clientId)}` +
      `&logout_uri=${encodeURIComponent(args.logoutRedirect)}`
    );
  }

import { WebAuth, Management, Auth0DecodedHash, Auth0ParseHashError, Auth0UserProfile } from 'auth0-js';

const scope = [
  'openid', 'profile', 'permissions', 'roles', 'groups',
  'email', 'read:current_user', 'update:current_user_metadata',
  'create:current_user_metadata',
];

export default class Authenticator {
  public auth0: WebAuth;
  public readonly NAMESPACE = 'https://kithandkink.com/';

  constructor() {
    this.auth0 = new WebAuth({
      domain: process.env.VUE_APP_AUTH0_DOMAIN || '',
      clientID: process.env.VUE_APP_AUTH0_CLIENT_ID || '',
      redirectUri: `${location.origin}${process.env.BASE_URL}callback`,
      responseType: 'token id_token',
      scope: scope.join(' '),
      audience: 'https://tmszero.auth0.com/api/v2/',
    });
  }

  public login() {
    this.auth0.authorize();
  }

  public handleAuthentication(): Promise<Auth0DecodedHash | null> {
    return new Promise((resolve, reject) => {
      this.auth0.parseHash((err: null | Auth0ParseHashError, authResult: Auth0DecodedHash | null) => {
        if (err) { reject(err); return; }

        resolve(authResult);
      });
    });
  }

  public renewSession(): Promise<Auth0DecodedHash | null> {
    return new Promise((resolve, reject) => {
      this.auth0.checkSession({}, (err: null | Auth0ParseHashError, authResult: Auth0DecodedHash | null) => {
        if (err) { reject(err); return; }
        resolve(authResult);
      });
    });
  }

  public updateUserMeta(accessToken: string, userSub: string,
                        obj: {[index: string]: any}): Promise<Auth0UserProfile | null> {
    return new Promise((resolve, reject) => {
      const auth0mg = new Management({
        domain: process.env.VUE_APP_AUTH0_DOMAIN || '',
        token: accessToken,
      });

      auth0mg.patchUserMetadata(userSub, obj, (err, prof) => {
        if (err) { reject(err); return; }
        resolve(prof);
      });
    });
  }
}

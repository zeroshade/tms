import _Vue from 'vue';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

/** Define a default action to perform after authentication */
const DEFAULT_REDIRECT_CALLBACK = (appstate: any) =>
  window.history.replaceState({}, document.title, window.location.pathname);


export class Auth {
  public loading = true;
  public isAuthenticated = false;
  public user = {};
  public auth0Client: Auth0Client | null = null;
  public popupOpen = false;
  public error: Error | null = null;
  public redirectCallback: (appState: any) => void = DEFAULT_REDIRECT_CALLBACK;

  public async initialize(redirect?: (appState: any) => void) {
    if (redirect) {
      this.redirectCallback = redirect;
    }

    this.auth0Client = await createAuth0Client({
      domain: process.env.VUE_APP_AUTH0_DOMAIN || '',
      client_id: process.env.VUE_APP_AUTH0_CLIENT_ID || '',
      redirect_uri: window.location.origin + process.env.BASE_URL + 'admin/',
      audience: `https://${process.env.VUE_APP_AUTH0_DOMAIN}/api/v2/`,
    });

    try {
      if (window.location.search.includes('error=') ||
          (window.location.search.includes('code=') &&
          window.location.search.includes('state='))) {
        // handle the redirect and retrieve tokens
        const { appState } = await this.auth0Client!.handleRedirectCallback();
        // Notify subscribers that the redirect callback has happened, passing the appState
        // (useful for retrieving any pre-authentication state)
        this.error = null;
        this.redirectCallback(appState);
      }
    } catch (e) {
      this.error = e;
    } finally {
      this.isAuthenticated = await this.auth0Client.isAuthenticated();
      this.user = await this.auth0Client.getUser();
      this.loading = false;
    }
  }

  public async getUser(): Promise<{[claim: string]: string | string[]}> {
    return await this.auth0Client?.getUser();
  }

  public async loginWithPopup(o: any) {
    this.popupOpen = true;
    try {
      await this.auth0Client!.loginWithPopup(o);
    } catch (e) {
      console.error(e);
    } finally {
      this.popupOpen = false;
    }
    this.user = await this.auth0Client!.getUser();
    this.isAuthenticated = true;
  }

  public async handleRedirectCallback() {
    this.loading = true;
    try {
      await this.auth0Client!.handleRedirectCallback();
      this.user = await this.auth0Client!.getUser();
      this.isAuthenticated = true;
    } catch (e) {
      this.error = e;
      this.logout({
        returnTo: 'google.com',
      });
    } finally {
      this.loading = false;
    }
  }

  public loginWithRedirect(o?: any) {
    return this.auth0Client!.loginWithRedirect(o);
  }

  public getIdTokenClaims(o?: any) {
    return this.auth0Client!.getIdTokenClaims(o);
  }

  public getTokenSilently(o?: any): Promise<string> {
    return this.auth0Client!.getTokenSilently(o);
  }

  public getTokenWithPopup(o: any) {
    return this.auth0Client!.getTokenWithPopup(o);
  }

  public logout(o: any) {
    return this.auth0Client!.logout(o);
  }
}

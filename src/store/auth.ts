import { Auth } from '@/api/auth';
import { AuthState, RootState } from './states';
import { Module } from 'vuex';
import getUsers from '@/api/users';

const auth = new Auth();
export function getAuthInstance(): Auth {
  return auth;
}

const authModule: Module<AuthState, RootState> = {
  namespaced: true,
  state: {
    auth,
    loading: true,
    authenticated: false,
  },
  getters: {
    loading(state: AuthState): boolean {
      return state.loading;
    },
    authenticated(state: AuthState): boolean {
      return state.authenticated;
    },
    user(state: AuthState): object {
      return state.auth.user;
    },
  },
  mutations: {
    setInit(state: AuthState) {
      state.loading = false;
      state.authenticated = state.auth.isAuthenticated;
    },
    setAuth(state: AuthState, isauth: boolean) {
      state.authenticated = isauth;
    },
  },
  actions: {
    async initAuth({state, commit}, redir?: (appState: RedirectLoginResult) => void) {
      await state.auth.initialize(redir);
      commit('setInit');
    },
    async loginWithPopup({state, commit}, o: any) {
      await state.auth.loginWithPopup(o);
      commit('setAuth', true);
    },
    loginWithRedirect({state}, o: any) {
      state.auth.loginWithRedirect(o);
    },
    logout({state}, o: any) {
      state.auth.logout(o);
    },
    async getIdTokenClaims({state}): Promise<object> {
      return await state.auth.getIdTokenClaims();
    },
    async getBearerToken({state}): Promise<string> {
      return await state.auth.getTokenSilently();
    },
    async getUsers({state, dispatch}): Promise<any> {
      const token = await dispatch('getBearerToken');
      return await getUsers(token);
    },
  },
};

export default authModule;

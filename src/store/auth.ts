import { Auth } from '@/api/auth';
import { AuthState, RootState } from './states';
import { Module } from 'vuex';
import getUsers, { User, addUser, deleteUser, resetPass } from '@/api/users';
import { GetTokenSilentlyVerboseResponse, RedirectLoginResult } from '@auth0/auth0-spa-js/dist/typings/global';
import { Logged, getLoggedActions } from '@/api/utils';

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
    userList: [],
  },
  getters: {
    autherror(state: AuthState): Error | null {
      return state.auth.error;
    },
    loading(state: AuthState): boolean {
      return auth.loading;
    },
    authenticated(state: AuthState): boolean {
      return auth.isAuthenticated;
    },
    user(state: AuthState): object {
      return auth.user;
    },
    users(state: AuthState): User[] {
      return state.userList;
    },
  },
  mutations: {
    setInit(state: AuthState) {
      state.loading = false;
      state.authenticated = auth.isAuthenticated;
    },
    setAuth(state: AuthState, isauth: boolean) {
      state.authenticated = isauth;
    },
    setUsers(state: AuthState, users: User[]) {
      state.userList = users;
    },
  },
  actions: {
    async initAuth({state, commit}, redir?: (appState: RedirectLoginResult) => void) {
      await state.auth.initialize(redir);
      commit('setInit');
    },
    async getUser() {
      return await auth.getUser();
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
    async getIdTokenClaims({state}): Promise<object | undefined> {
      return await state.auth.getIdTokenClaims();
    },
    async getBearerToken({state}): Promise<GetTokenSilentlyVerboseResponse> {
      return await state.auth.getTokenSilently();
    },
    async makeAuthReq({dispatch}, req: Request): Promise<Response> {
      const token = await dispatch('getBearerToken');
      return await fetch(req, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    async loadUsers({commit, dispatch}): Promise<void> {
      const resp = await dispatch('makeAuthReq', getUsers());
      commit('setUsers', await resp.json());
    },
    async addUser({dispatch}, u: User): Promise<null | string> {
      const resp: Response = await dispatch('makeAuthReq', addUser(u));
      if (resp.ok) {
        return null;
      }

      return ((await resp.json()) as {err: string}).err;
    },
    async deleteUser({dispatch}, userid: string): Promise<void> {
      await dispatch('makeAuthReq', deleteUser(userid));
      await dispatch('loadUsers');
    },
    async resetPass({dispatch}, payload: {userid: string, newpass: string}): Promise<void> {
      await dispatch('makeAuthReq', resetPass(payload.userid, payload.newpass));
    },
    async getLogs({dispatch}): Promise<Logged[]> {
      return await (await dispatch('makeAuthReq', getLoggedActions())).json();
    },
  },
};

export default authModule;

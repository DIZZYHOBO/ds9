import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  MastodonAccount,
  MastodonClient,
  MastodonInstance,
} from "#/services/mastodon";
import { AppDispatch, RootState } from "#/store";

const MASTODON_APP_STORAGE_PREFIX = "mastodon_app_";
const MASTODON_ACCOUNTS_STORAGE_KEY = "mastodon_accounts";
const MASTODON_MODE_STORAGE_KEY = "mastodon_mode";

// OAuth app scopes
export const MASTODON_SCOPES = "read write follow push";
export const MASTODON_APP_NAME = "Voyager";
export const MASTODON_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

// Stored OAuth app credentials per instance
export interface MastodonAppCredentials {
  clientId: string;
  clientSecret: string;
  instance: string;
}

// Stored account with token
export interface MastodonAccountCredential {
  instance: string;
  accessToken: string;
  account: MastodonAccount;
}

export interface MastodonAccountsStoragePayload {
  accounts: MastodonAccountCredential[];
  activeHandle?: string; // format: username@instance
}

interface MastodonAuthState {
  accountData: MastodonAccountsStoragePayload | undefined;
  connectedInstance: string | undefined;
  instanceInfo: Record<string, MastodonInstance>;
  pendingAuth: {
    instance: string;
    clientId: string;
    clientSecret: string;
  } | null;
  loading: boolean;
  error: string | null;
  // Flag to indicate whether Mastodon mode is active (vs Lemmy mode)
  isMastodonMode: boolean;
}

function getAccountsFromStorage(): MastodonAccountsStoragePayload | undefined {
  const stored = localStorage.getItem(MASTODON_ACCOUNTS_STORAGE_KEY);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function saveAccountsToStorage(data: MastodonAccountsStoragePayload | undefined) {
  if (!data) {
    localStorage.removeItem(MASTODON_ACCOUNTS_STORAGE_KEY);
    return;
  }
  localStorage.setItem(MASTODON_ACCOUNTS_STORAGE_KEY, JSON.stringify(data));
}

function getAppCredentialsFromStorage(instance: string): MastodonAppCredentials | undefined {
  const stored = localStorage.getItem(`${MASTODON_APP_STORAGE_PREFIX}${instance}`);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function saveAppCredentialsToStorage(credentials: MastodonAppCredentials) {
  localStorage.setItem(
    `${MASTODON_APP_STORAGE_PREFIX}${credentials.instance}`,
    JSON.stringify(credentials),
  );
}

function getMastodonModeFromStorage(): boolean {
  const stored = localStorage.getItem(MASTODON_MODE_STORAGE_KEY);
  if (stored !== null) {
    return stored === "true";
  }
  // If no mode is stored, check if there's an active Mastodon account
  // This handles users who logged in before mode persistence was added
  const accountData = getAccountsFromStorage();
  return !!(accountData?.activeHandle);
}

function saveMastodonModeToStorage(mode: boolean) {
  localStorage.setItem(MASTODON_MODE_STORAGE_KEY, String(mode));
}

const initialState: MastodonAuthState = {
  accountData: getAccountsFromStorage(),
  connectedInstance: undefined,
  instanceInfo: {},
  pendingAuth: null,
  loading: false,
  error: null,
  isMastodonMode: getMastodonModeFromStorage(),
};

export const mastodonAuthSlice = createSlice({
  name: "mastodonAuth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPendingAuth: (
      state,
      action: PayloadAction<{
        instance: string;
        clientId: string;
        clientSecret: string;
      } | null>,
    ) => {
      state.pendingAuth = action.payload;
    },
    addMastodonAccount: (state, action: PayloadAction<MastodonAccountCredential>) => {
      const handle = `${action.payload.account.username}@${action.payload.instance}`;

      state.accountData ??= {
        accounts: [],
        activeHandle: handle,
      };

      // Remove existing account with same handle
      const existingIndex = state.accountData.accounts.findIndex(
        (a) => `${a.account.username}@${a.instance}` === handle,
      );
      if (existingIndex !== -1) {
        state.accountData.accounts.splice(existingIndex, 1);
      }

      // Add the new account
      state.accountData.accounts.unshift(action.payload);
      state.accountData.activeHandle = handle;

      // Enable Mastodon mode since user just logged in
      state.isMastodonMode = true;
      saveMastodonModeToStorage(true);

      saveAccountsToStorage(state.accountData);
    },
    removeMastodonAccount: (state, action: PayloadAction<string>) => {
      if (!state.accountData) return;

      state.accountData.accounts = state.accountData.accounts.filter(
        (a) => `${a.account.username}@${a.instance}` !== action.payload,
      );

      if (state.accountData.accounts.length === 0) {
        state.accountData = undefined;
        state.isMastodonMode = false;
        saveAccountsToStorage(undefined);
        saveMastodonModeToStorage(false);
        return;
      }

      // If the removed account was active, switch to the first remaining
      if (state.accountData.activeHandle === action.payload) {
        const first = state.accountData.accounts[0];
        state.accountData.activeHandle = first
          ? `${first.account.username}@${first.instance}`
          : undefined;
      }

      saveAccountsToStorage(state.accountData);
    },
    setActiveMastodonAccount: (state, action: PayloadAction<string>) => {
      if (!state.accountData) return;

      const exists = state.accountData.accounts.some(
        (a) => `${a.account.username}@${a.instance}` === action.payload,
      );
      if (exists) {
        state.accountData.activeHandle = action.payload;
        saveAccountsToStorage(state.accountData);
      }
    },
    setMastodonAccounts: (state, action: PayloadAction<MastodonAccountCredential[]>) => {
      if (!state.accountData) return;

      state.accountData.accounts = action.payload;
      saveAccountsToStorage(state.accountData);
    },
    setConnectedInstance: (state, action: PayloadAction<string | undefined>) => {
      state.connectedInstance = action.payload;
    },
    setInstanceInfo: (
      state,
      action: PayloadAction<{ instance: string; info: MastodonInstance }>,
    ) => {
      state.instanceInfo[action.payload.instance] = action.payload.info;
    },
    setMastodonMode: (state, action: PayloadAction<boolean>) => {
      state.isMastodonMode = action.payload;
      saveMastodonModeToStorage(action.payload);
    },
    resetMastodonAuth: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setPendingAuth,
  addMastodonAccount,
  removeMastodonAccount,
  setActiveMastodonAccount,
  setMastodonAccounts,
  setConnectedInstance,
  setInstanceInfo,
  setMastodonMode,
  resetMastodonAuth,
} = mastodonAuthSlice.actions;

export default mastodonAuthSlice.reducer;

// Selectors

export const mastodonAccountsSelector = (state: RootState) =>
  state.mastodonAuth.accountData?.accounts ?? [];

export const activeMastodonAccountSelector = (state: RootState) => {
  // Only return the active Mastodon account if Mastodon mode is enabled
  if (!state.mastodonAuth.isMastodonMode) return undefined;

  const data = state.mastodonAuth.accountData;
  if (!data?.activeHandle) return undefined;

  return data.accounts.find(
    (a) => `${a.account.username}@${a.instance}` === data.activeHandle,
  );
};

export const mastodonClientSelector = (state: RootState) => {
  const active = activeMastodonAccountSelector(state);
  if (!active) return undefined;

  return new MastodonClient(active.instance, active.accessToken);
};

export const mastodonHandleSelector = (state: RootState) => {
  const active = activeMastodonAccountSelector(state);
  if (!active) return undefined;
  return `${active.account.username}@${active.instance}`;
};

export const mastodonLoggedInSelector = (state: RootState) =>
  !!activeMastodonAccountSelector(state);

// Thunks

export const initMastodonOAuth =
  (instance: string) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Check if we already have app credentials for this instance
      let appCredentials = getAppCredentialsFromStorage(instance);

      if (!appCredentials) {
        // Register a new app on this instance
        const app = await MastodonClient.registerApp(
          instance,
          MASTODON_APP_NAME,
          MASTODON_REDIRECT_URI,
          MASTODON_SCOPES,
          "https://vger.app",
        );

        appCredentials = {
          clientId: app.client_id,
          clientSecret: app.client_secret,
          instance,
        };

        saveAppCredentialsToStorage(appCredentials);
      }

      // Store pending auth state
      dispatch(
        setPendingAuth({
          instance,
          clientId: appCredentials.clientId,
          clientSecret: appCredentials.clientSecret,
        }),
      );

      // Return the authorization URL for the user to visit
      const authUrl = MastodonClient.getAuthorizationUrl(
        instance,
        appCredentials.clientId,
        MASTODON_REDIRECT_URI,
        MASTODON_SCOPES,
      );

      dispatch(setLoading(false));
      return authUrl;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setError(error instanceof Error ? error.message : "Failed to initialize OAuth"));
      throw error;
    }
  };

export const completeMastodonOAuth =
  (code: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const pendingAuth = getState().mastodonAuth.pendingAuth;
    if (!pendingAuth) {
      throw new Error("No pending authentication");
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Exchange code for token
      const token = await MastodonClient.obtainToken(
        pendingAuth.instance,
        pendingAuth.clientId,
        pendingAuth.clientSecret,
        MASTODON_REDIRECT_URI,
        code,
      );

      // Verify credentials and get account info
      const client = new MastodonClient(pendingAuth.instance, token.access_token);
      const account = await client.verifyCredentials();

      // Add the account
      dispatch(
        addMastodonAccount({
          instance: pendingAuth.instance,
          accessToken: token.access_token,
          account,
        }),
      );

      // Clear pending auth
      dispatch(setPendingAuth(null));
      dispatch(setLoading(false));

      return account;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setError(error instanceof Error ? error.message : "Failed to complete OAuth"));
      throw error;
    }
  };

export const logoutMastodonAccount =
  (handle: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const accounts = getState().mastodonAuth.accountData?.accounts;
    const account = accounts?.find(
      (a) => `${a.account.username}@${a.instance}` === handle,
    );

    if (account) {
      // Try to revoke the token
      const appCredentials = getAppCredentialsFromStorage(account.instance);
      if (appCredentials) {
        try {
          await MastodonClient.revokeToken(
            account.instance,
            appCredentials.clientId,
            appCredentials.clientSecret,
            account.accessToken,
          );
        } catch {
          // Ignore errors revoking token
        }
      }
    }

    dispatch(removeMastodonAccount(handle));
  };

export const fetchMastodonInstanceInfo =
  (instance: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const existing = getState().mastodonAuth.instanceInfo[instance];
    if (existing) return existing;

    try {
      const client = new MastodonClient(instance);
      const info = await client.getInstance();
      dispatch(setInstanceInfo({ instance, info }));
      return info;
    } catch {
      return undefined;
    }
  };

export const switchMastodonAccount =
  (handle: string) => (dispatch: AppDispatch) => {
    dispatch(setActiveMastodonAccount(handle));
    dispatch(setMastodonMode(true));
  };

// Helper to get Mastodon client for a specific account
export function getMastodonClient(
  state: RootState,
  handle?: string,
): MastodonClient | undefined {
  const data = state.mastodonAuth.accountData;
  if (!data) return undefined;

  const targetHandle = handle ?? data.activeHandle;
  if (!targetHandle) return undefined;

  const account = data.accounts.find(
    (a) => `${a.account.username}@${a.instance}` === targetHandle,
  );
  if (!account) return undefined;

  return new MastodonClient(account.instance, account.accessToken);
}

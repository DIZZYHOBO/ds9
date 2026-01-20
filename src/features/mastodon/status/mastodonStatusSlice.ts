import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  MastodonClient,
  MastodonContext,
  MastodonStatus,
  PaginatedResponse,
} from "#/services/mastodon";
import { AppDispatch, RootState } from "#/store";

import { getMastodonClient } from "../../auth/mastodon/mastodonAuthSlice";

interface MastodonStatusState {
  statusById: Record<string, MastodonStatus>;
  contextById: Record<string, MastodonContext>;
  // Interaction states (optimistic updates)
  favouritedById: Record<string, boolean | undefined>;
  rebloggedById: Record<string, boolean | undefined>;
  bookmarkedById: Record<string, boolean | undefined>;
  mutedById: Record<string, boolean | undefined>;
  // Loading states
  loadingStatus: Record<string, boolean>;
  loadingContext: Record<string, boolean>;
}

const initialState: MastodonStatusState = {
  statusById: {},
  contextById: {},
  favouritedById: {},
  rebloggedById: {},
  bookmarkedById: {},
  mutedById: {},
  loadingStatus: {},
  loadingContext: {},
};

export const mastodonStatusSlice = createSlice({
  name: "mastodonStatus",
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<MastodonStatus>) => {
      state.statusById[action.payload.id] = action.payload;
      // Also update interaction states from the status
      if (action.payload.favourited !== undefined) {
        state.favouritedById[action.payload.id] = action.payload.favourited;
      }
      if (action.payload.reblogged !== undefined) {
        state.rebloggedById[action.payload.id] = action.payload.reblogged;
      }
      if (action.payload.bookmarked !== undefined) {
        state.bookmarkedById[action.payload.id] = action.payload.bookmarked;
      }
      if (action.payload.muted !== undefined) {
        state.mutedById[action.payload.id] = action.payload.muted;
      }
    },
    setStatuses: (state, action: PayloadAction<MastodonStatus[]>) => {
      for (const status of action.payload) {
        state.statusById[status.id] = status;
        if (status.favourited !== undefined) {
          state.favouritedById[status.id] = status.favourited;
        }
        if (status.reblogged !== undefined) {
          state.rebloggedById[status.id] = status.reblogged;
        }
        if (status.bookmarked !== undefined) {
          state.bookmarkedById[status.id] = status.bookmarked;
        }
        if (status.muted !== undefined) {
          state.mutedById[status.id] = status.muted;
        }
      }
    },
    setContext: (
      state,
      action: PayloadAction<{ id: string; context: MastodonContext }>,
    ) => {
      state.contextById[action.payload.id] = action.payload.context;
      // Also cache statuses from context
      for (const status of [
        ...action.payload.context.ancestors,
        ...action.payload.context.descendants,
      ]) {
        state.statusById[status.id] = status;
      }
    },
    removeStatus: (state, action: PayloadAction<string>) => {
      delete state.statusById[action.payload];
      delete state.favouritedById[action.payload];
      delete state.rebloggedById[action.payload];
      delete state.bookmarkedById[action.payload];
      delete state.mutedById[action.payload];
    },
    updateFavourited: (
      state,
      action: PayloadAction<{ id: string; favourited: boolean }>,
    ) => {
      state.favouritedById[action.payload.id] = action.payload.favourited;
      const status = state.statusById[action.payload.id];
      if (status) {
        status.favourited = action.payload.favourited;
        status.favourites_count += action.payload.favourited ? 1 : -1;
      }
    },
    updateReblogged: (
      state,
      action: PayloadAction<{ id: string; reblogged: boolean }>,
    ) => {
      state.rebloggedById[action.payload.id] = action.payload.reblogged;
      const status = state.statusById[action.payload.id];
      if (status) {
        status.reblogged = action.payload.reblogged;
        status.reblogs_count += action.payload.reblogged ? 1 : -1;
      }
    },
    updateBookmarked: (
      state,
      action: PayloadAction<{ id: string; bookmarked: boolean }>,
    ) => {
      state.bookmarkedById[action.payload.id] = action.payload.bookmarked;
      const status = state.statusById[action.payload.id];
      if (status) {
        status.bookmarked = action.payload.bookmarked;
      }
    },
    updateMuted: (
      state,
      action: PayloadAction<{ id: string; muted: boolean }>,
    ) => {
      state.mutedById[action.payload.id] = action.payload.muted;
      const status = state.statusById[action.payload.id];
      if (status) {
        status.muted = action.payload.muted;
      }
    },
    setLoadingStatus: (
      state,
      action: PayloadAction<{ id: string; loading: boolean }>,
    ) => {
      state.loadingStatus[action.payload.id] = action.payload.loading;
    },
    setLoadingContext: (
      state,
      action: PayloadAction<{ id: string; loading: boolean }>,
    ) => {
      state.loadingContext[action.payload.id] = action.payload.loading;
    },
    resetMastodonStatus: () => initialState,
  },
});

export const {
  setStatus,
  setStatuses,
  setContext,
  removeStatus,
  updateFavourited,
  updateReblogged,
  updateBookmarked,
  updateMuted,
  setLoadingStatus,
  setLoadingContext,
  resetMastodonStatus,
} = mastodonStatusSlice.actions;

export default mastodonStatusSlice.reducer;

// Selectors

export const mastodonStatusByIdSelector =
  (id: string) => (state: RootState) =>
    state.mastodonStatus.statusById[id];

export const mastodonContextByIdSelector =
  (id: string) => (state: RootState) =>
    state.mastodonStatus.contextById[id];

export const mastodonFavouritedSelector =
  (id: string) => (state: RootState) =>
    state.mastodonStatus.favouritedById[id];

export const mastodonRebloggedSelector =
  (id: string) => (state: RootState) =>
    state.mastodonStatus.rebloggedById[id];

export const mastodonBookmarkedSelector =
  (id: string) => (state: RootState) =>
    state.mastodonStatus.bookmarkedById[id];

// Thunks

export const fetchMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    dispatch(setLoadingStatus({ id, loading: true }));

    try {
      const status = await client.getStatus(id);
      dispatch(setStatus(status));
      return status;
    } finally {
      dispatch(setLoadingStatus({ id, loading: false }));
    }
  };

export const fetchMastodonContext =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    dispatch(setLoadingContext({ id, loading: true }));

    try {
      const context = await client.getStatusContext(id);
      dispatch(setContext({ id, context }));
      return context;
    } finally {
      dispatch(setLoadingContext({ id, loading: false }));
    }
  };

export const favouriteMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.favouritedById[id];

    // Optimistic update
    dispatch(updateFavourited({ id, favourited: true }));

    try {
      const status = await client.favouriteStatus(id);
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateFavourited({ id, favourited: previousState ?? false }));
      throw error;
    }
  };

export const unfavouriteMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.favouritedById[id];

    // Optimistic update
    dispatch(updateFavourited({ id, favourited: false }));

    try {
      const status = await client.unfavouriteStatus(id);
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateFavourited({ id, favourited: previousState ?? true }));
      throw error;
    }
  };

export const toggleFavouriteMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const isFavourited = getState().mastodonStatus.favouritedById[id];
    if (isFavourited) {
      return dispatch(unfavouriteMastodonStatus(id));
    } else {
      return dispatch(favouriteMastodonStatus(id));
    }
  };

export const reblogMastodonStatus =
  (id: string, visibility?: "public" | "unlisted" | "private") =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.rebloggedById[id];

    // Optimistic update
    dispatch(updateReblogged({ id, reblogged: true }));

    try {
      const status = await client.reblogStatus(id, { visibility });
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateReblogged({ id, reblogged: previousState ?? false }));
      throw error;
    }
  };

export const unreblogMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.rebloggedById[id];

    // Optimistic update
    dispatch(updateReblogged({ id, reblogged: false }));

    try {
      const status = await client.unreblogStatus(id);
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateReblogged({ id, reblogged: previousState ?? true }));
      throw error;
    }
  };

export const toggleReblogMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const isReblogged = getState().mastodonStatus.rebloggedById[id];
    if (isReblogged) {
      return dispatch(unreblogMastodonStatus(id));
    } else {
      return dispatch(reblogMastodonStatus(id));
    }
  };

export const bookmarkMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.bookmarkedById[id];

    // Optimistic update
    dispatch(updateBookmarked({ id, bookmarked: true }));

    try {
      const status = await client.bookmarkStatus(id);
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateBookmarked({ id, bookmarked: previousState ?? false }));
      throw error;
    }
  };

export const unbookmarkMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const previousState = getState().mastodonStatus.bookmarkedById[id];

    // Optimistic update
    dispatch(updateBookmarked({ id, bookmarked: false }));

    try {
      const status = await client.unbookmarkStatus(id);
      dispatch(setStatus(status));
      return status;
    } catch (error) {
      // Rollback on error
      dispatch(updateBookmarked({ id, bookmarked: previousState ?? true }));
      throw error;
    }
  };

export const toggleBookmarkMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const isBookmarked = getState().mastodonStatus.bookmarkedById[id];
    if (isBookmarked) {
      return dispatch(unbookmarkMastodonStatus(id));
    } else {
      return dispatch(bookmarkMastodonStatus(id));
    }
  };

export const deleteMastodonStatus =
  (id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const deleted = await client.deleteStatus(id);
    dispatch(removeStatus(id));
    return deleted;
  };

export const createMastodonStatus =
  (params: {
    status?: string;
    media_ids?: string[];
    poll?: {
      options: string[];
      expires_in: number;
      multiple?: boolean;
      hide_totals?: boolean;
    };
    in_reply_to_id?: string;
    sensitive?: boolean;
    spoiler_text?: string;
    visibility?: "public" | "unlisted" | "private" | "direct";
    language?: string;
  }) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const status = await client.createStatus(params);
    dispatch(setStatus(status));
    return status;
  };

export const editMastodonStatus =
  (
    id: string,
    params: {
      status?: string;
      media_ids?: string[];
      poll?: {
        options: string[];
        expires_in: number;
        multiple?: boolean;
        hide_totals?: boolean;
      };
      sensitive?: boolean;
      spoiler_text?: string;
      language?: string;
    },
  ) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const client = getMastodonClient(getState());
    if (!client) throw new Error("Not logged in to Mastodon");

    const status = await client.editStatus(id, params);
    dispatch(setStatus(status));
    return status;
  };

// Timeline fetch functions that return paginated results
// These are used by the Feed component

export async function fetchMastodonHomeTimeline(
  client: MastodonClient,
  maxId?: string,
  limit = 20,
): Promise<PaginatedResponse<MastodonStatus>> {
  return client.getHomeTimeline({ max_id: maxId, limit });
}

export async function fetchMastodonPublicTimeline(
  client: MastodonClient,
  options: { local?: boolean; maxId?: string; limit?: number } = {},
): Promise<PaginatedResponse<MastodonStatus>> {
  return client.getPublicTimeline({
    local: options.local,
    max_id: options.maxId,
    limit: options.limit ?? 20,
  });
}

export async function fetchMastodonTagTimeline(
  client: MastodonClient,
  hashtag: string,
  options: { local?: boolean; maxId?: string; limit?: number } = {},
): Promise<PaginatedResponse<MastodonStatus>> {
  return client.getTagTimeline(hashtag, {
    local: options.local,
    max_id: options.maxId,
    limit: options.limit ?? 20,
  });
}

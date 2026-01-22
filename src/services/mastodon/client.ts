/**
 * Mastodon API Client
 *
 * A comprehensive client for interacting with Mastodon's REST API.
 * Supports OAuth authentication, timelines, statuses, interactions, and more.
 */

import { isNative } from "#/helpers/device";
import nativeFetch from "../nativeFetch";

const usingNativeFetch = isNative();

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "TuvixApp/1.0",
} as const;

export function buildMastodonBaseUrl(instance: string): string {
  if (import.meta.env.VITE_FORCE_LEMMY_INSECURE) {
    return `http://${instance}`;
  }
  return `https://${instance}`;
}

// Mastodon API Types

export interface MastodonApplication {
  id: string;
  name: string;
  website?: string;
  scopes: string[];
  redirect_uri: string;
  redirect_uris: string[];
  client_id: string;
  client_secret: string;
  client_secret_expires_at: number;
}

export interface MastodonToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

export interface MastodonAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot: boolean;
  discoverable?: boolean;
  group: boolean;
  created_at: string;
  note: string;
  url: string;
  uri: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  last_status_at?: string;
  emojis: MastodonEmoji[];
  fields: MastodonField[];
  source?: MastodonSource;
  role?: MastodonRole;
}

export interface MastodonSource {
  privacy: string;
  sensitive: boolean;
  language: string;
  note: string;
  fields: MastodonField[];
  follow_requests_count?: number;
}

export interface MastodonRole {
  id: string;
  name: string;
  permissions: string;
  color: string;
  highlighted: boolean;
}

export interface MastodonEmoji {
  shortcode: string;
  url: string;
  static_url: string;
  visible_in_picker: boolean;
  category?: string;
}

export interface MastodonField {
  name: string;
  value: string;
  verified_at?: string;
}

export interface MastodonStatus {
  id: string;
  uri: string;
  created_at: string;
  account: MastodonAccount;
  content: string;
  visibility: "public" | "unlisted" | "private" | "direct";
  sensitive: boolean;
  spoiler_text: string;
  media_attachments: MastodonMediaAttachment[];
  application?: {
    name: string;
    website?: string;
  };
  mentions: MastodonMention[];
  tags: MastodonTag[];
  emojis: MastodonEmoji[];
  reblogs_count: number;
  favourites_count: number;
  replies_count: number;
  url?: string;
  in_reply_to_id?: string;
  in_reply_to_account_id?: string;
  reblog?: MastodonStatus;
  poll?: MastodonPoll;
  card?: MastodonCard;
  language?: string;
  text?: string;
  edited_at?: string;
  favourited?: boolean;
  reblogged?: boolean;
  muted?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
  filtered?: MastodonFilterResult[];
}

export interface MastodonMediaAttachment {
  id: string;
  type: "image" | "video" | "gifv" | "audio" | "unknown";
  url: string;
  preview_url?: string;
  remote_url?: string;
  meta?: Record<string, unknown>;
  description?: string;
  blurhash?: string;
}

export interface MastodonMention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

export interface MastodonTag {
  name: string;
  url: string;
  history?: MastodonTagHistory[];
}

export interface MastodonTagHistory {
  day: string;
  uses: string;
  accounts: string;
}

export interface MastodonPoll {
  id: string;
  expires_at?: string;
  expired: boolean;
  multiple: boolean;
  votes_count: number;
  voters_count?: number;
  options: MastodonPollOption[];
  emojis: MastodonEmoji[];
  voted?: boolean;
  own_votes?: number[];
}

export interface MastodonPollOption {
  title: string;
  votes_count?: number;
}

export interface MastodonCard {
  url: string;
  title: string;
  description: string;
  type: "link" | "photo" | "video" | "rich";
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  html?: string;
  width?: number;
  height?: number;
  image?: string;
  embed_url?: string;
  blurhash?: string;
}

export interface MastodonFilterResult {
  filter: MastodonFilter;
  keyword_matches?: string[];
  status_matches?: string[];
}

export interface MastodonFilter {
  id: string;
  title: string;
  context: string[];
  expires_at?: string;
  filter_action: "warn" | "hide";
  keywords: MastodonFilterKeyword[];
  statuses: MastodonFilterStatus[];
}

export interface MastodonFilterKeyword {
  id: string;
  keyword: string;
  whole_word: boolean;
}

export interface MastodonFilterStatus {
  id: string;
  status_id: string;
}

export interface MastodonNotification {
  id: string;
  type:
    | "mention"
    | "status"
    | "reblog"
    | "follow"
    | "follow_request"
    | "favourite"
    | "poll"
    | "update"
    | "admin.sign_up"
    | "admin.report";
  created_at: string;
  account: MastodonAccount;
  status?: MastodonStatus;
  report?: MastodonReport;
}

export interface MastodonReport {
  id: string;
  action_taken: boolean;
  action_taken_at?: string;
  category: string;
  comment: string;
  forwarded: boolean;
  created_at: string;
  status_ids?: string[];
  rule_ids?: string[];
  target_account: MastodonAccount;
}

export interface MastodonRelationship {
  id: string;
  following: boolean;
  showing_reblogs: boolean;
  notifying: boolean;
  followed_by: boolean;
  blocking: boolean;
  blocked_by: boolean;
  muting: boolean;
  muting_notifications: boolean;
  requested: boolean;
  domain_blocking: boolean;
  endorsed: boolean;
  note: string;
}

export interface MastodonContext {
  ancestors: MastodonStatus[];
  descendants: MastodonStatus[];
}

export interface MastodonInstance {
  domain: string;
  title: string;
  version: string;
  source_url: string;
  description: string;
  usage: {
    users: {
      active_month: number;
    };
  };
  thumbnail: {
    url: string;
    blurhash?: string;
    versions?: Record<string, string>;
  };
  languages: string[];
  configuration: MastodonInstanceConfiguration;
  registrations: {
    enabled: boolean;
    approval_required: boolean;
    message?: string;
  };
  contact: {
    email: string;
    account?: MastodonAccount;
  };
  rules: MastodonRule[];
}

export interface MastodonInstanceConfiguration {
  urls: {
    streaming?: string;
    status?: string;
  };
  accounts: {
    max_featured_tags: number;
  };
  statuses: {
    max_characters: number;
    max_media_attachments: number;
    characters_reserved_per_url: number;
  };
  media_attachments: {
    supported_mime_types: string[];
    image_size_limit: number;
    image_matrix_limit: number;
    video_size_limit: number;
    video_frame_rate_limit: number;
    video_matrix_limit: number;
  };
  polls: {
    max_options: number;
    max_characters_per_option: number;
    min_expiration: number;
    max_expiration: number;
  };
  translation: {
    enabled: boolean;
  };
}

export interface MastodonRule {
  id: string;
  text: string;
}

export interface MastodonConversation {
  id: string;
  unread: boolean;
  accounts: MastodonAccount[];
  last_status?: MastodonStatus;
}

export interface MastodonList {
  id: string;
  title: string;
  replies_policy: "followed" | "list" | "none";
  exclusive: boolean;
}

// Pagination params
export interface MastodonPaginationParams {
  max_id?: string;
  since_id?: string;
  min_id?: string;
  limit?: number;
}

// Status creation params
export interface CreateStatusParams {
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
  scheduled_at?: string;
}

// Link header pagination response
export interface PaginatedResponse<T> {
  data: T[];
  next?: string;
  prev?: string;
}

function parseLinkHeader(header: string | null): { next?: string; prev?: string } {
  if (!header) return {};

  const links: { next?: string; prev?: string } = {};
  const parts = header.split(",");

  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="(\w+)"/);
    if (match) {
      const [, url, rel] = match;
      if (rel === "next" || rel === "prev") {
        links[rel] = url;
      }
    }
  }

  return links;
}

function extractMaxIdFromUrl(url: string): string | undefined {
  const match = url.match(/max_id=([^&]+)/);
  return match ? match[1] : undefined;
}

export class MastodonClient {
  private baseUrl: string;
  private accessToken?: string;
  private fetchFn: typeof fetch;

  constructor(instance: string, accessToken?: string) {
    this.baseUrl = buildMastodonBaseUrl(instance);
    this.accessToken = accessToken;
    this.fetchFn = usingNativeFetch ? nativeFetch : fetch.bind(globalThis);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { ...BASE_HEADERS };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
      signal,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async requestWithPagination<T>(
    endpoint: string,
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params?.max_id) searchParams.set("max_id", params.max_id);
    if (params?.since_id) searchParams.set("since_id", params.since_id);
    if (params?.min_id) searchParams.set("min_id", params.min_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchFn(url, {
      method: "GET",
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    const data = await response.json();
    const linkHeader = response.headers.get("Link");
    const links = parseLinkHeader(linkHeader);

    return {
      data,
      next: links.next ? extractMaxIdFromUrl(links.next) : undefined,
      prev: links.prev ? extractMaxIdFromUrl(links.prev) : undefined,
    };
  }

  // OAuth / Apps

  static async registerApp(
    instance: string,
    clientName: string,
    redirectUri: string,
    scopes: string,
    website?: string,
  ): Promise<MastodonApplication> {
    const baseUrl = buildMastodonBaseUrl(instance);
    const fetchFn = usingNativeFetch ? nativeFetch : fetch.bind(globalThis);

    const response = await fetchFn(`${baseUrl}/api/v1/apps`, {
      method: "POST",
      headers: BASE_HEADERS,
      body: JSON.stringify({
        client_name: clientName,
        redirect_uris: redirectUri,
        scopes,
        website,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, "/api/v1/apps");
    }

    return response.json();
  }

  static getAuthorizationUrl(
    instance: string,
    clientId: string,
    redirectUri: string,
    scopes: string,
  ): string {
    const baseUrl = buildMastodonBaseUrl(instance);
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      response_type: "code",
    });
    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  }

  static async obtainToken(
    instance: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string,
  ): Promise<MastodonToken> {
    const baseUrl = buildMastodonBaseUrl(instance);
    const fetchFn = usingNativeFetch ? nativeFetch : fetch.bind(globalThis);

    const response = await fetchFn(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: BASE_HEADERS,
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
        scope: "read write follow push",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, "/oauth/token");
    }

    return response.json();
  }

  static async revokeToken(
    instance: string,
    clientId: string,
    clientSecret: string,
    token: string,
  ): Promise<void> {
    const baseUrl = buildMastodonBaseUrl(instance);
    const fetchFn = usingNativeFetch ? nativeFetch : fetch.bind(globalThis);

    await fetchFn(`${baseUrl}/oauth/revoke`, {
      method: "POST",
      headers: BASE_HEADERS,
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        token,
      }),
    });
  }

  // Accounts

  async verifyCredentials(signal?: AbortSignal): Promise<MastodonAccount> {
    return this.request<MastodonAccount>(
      "GET",
      "/api/v1/accounts/verify_credentials",
      undefined,
      signal,
    );
  }

  async getAccount(id: string, signal?: AbortSignal): Promise<MastodonAccount> {
    return this.request<MastodonAccount>(
      "GET",
      `/api/v1/accounts/${id}`,
      undefined,
      signal,
    );
  }

  async lookupAccount(acct: string, signal?: AbortSignal): Promise<MastodonAccount> {
    const params = new URLSearchParams({ acct });
    return this.request<MastodonAccount>(
      "GET",
      `/api/v1/accounts/lookup?${params.toString()}`,
      undefined,
      signal,
    );
  }

  async getAccountStatuses(
    id: string,
    params?: MastodonPaginationParams & {
      only_media?: boolean;
      exclude_replies?: boolean;
      exclude_reblogs?: boolean;
      pinned?: boolean;
      tagged?: string;
    },
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    const searchParams = new URLSearchParams();
    if (params?.max_id) searchParams.set("max_id", params.max_id);
    if (params?.since_id) searchParams.set("since_id", params.since_id);
    if (params?.min_id) searchParams.set("min_id", params.min_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.only_media) searchParams.set("only_media", "true");
    if (params?.exclude_replies) searchParams.set("exclude_replies", "true");
    if (params?.exclude_reblogs) searchParams.set("exclude_reblogs", "true");
    if (params?.pinned) searchParams.set("pinned", "true");
    if (params?.tagged) searchParams.set("tagged", params.tagged);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/accounts/${id}/statuses${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    const data = await response.json();
    const linkHeader = response.headers.get("Link");
    const links = parseLinkHeader(linkHeader);

    return {
      data,
      next: links.next ? extractMaxIdFromUrl(links.next) : undefined,
      prev: links.prev ? extractMaxIdFromUrl(links.prev) : undefined,
    };
  }

  async getAccountFollowers(
    id: string,
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonAccount>> {
    return this.requestWithPagination<MastodonAccount>(
      `/api/v1/accounts/${id}/followers`,
      params,
      signal,
    );
  }

  async getAccountFollowing(
    id: string,
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonAccount>> {
    return this.requestWithPagination<MastodonAccount>(
      `/api/v1/accounts/${id}/following`,
      params,
      signal,
    );
  }

  async followAccount(
    id: string,
    options?: {
      reblogs?: boolean;
      notify?: boolean;
      languages?: string[];
    },
    signal?: AbortSignal,
  ): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/follow`,
      options,
      signal,
    );
  }

  async unfollowAccount(id: string, signal?: AbortSignal): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/unfollow`,
      undefined,
      signal,
    );
  }

  async blockAccount(id: string, signal?: AbortSignal): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/block`,
      undefined,
      signal,
    );
  }

  async unblockAccount(id: string, signal?: AbortSignal): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/unblock`,
      undefined,
      signal,
    );
  }

  async muteAccount(
    id: string,
    options?: {
      notifications?: boolean;
      duration?: number;
    },
    signal?: AbortSignal,
  ): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/mute`,
      options,
      signal,
    );
  }

  async unmuteAccount(id: string, signal?: AbortSignal): Promise<MastodonRelationship> {
    return this.request<MastodonRelationship>(
      "POST",
      `/api/v1/accounts/${id}/unmute`,
      undefined,
      signal,
    );
  }

  async getRelationships(ids: string[], signal?: AbortSignal): Promise<MastodonRelationship[]> {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("id[]", id));
    return this.request<MastodonRelationship[]>(
      "GET",
      `/api/v1/accounts/relationships?${params.toString()}`,
      undefined,
      signal,
    );
  }

  // Timelines

  async getHomeTimeline(
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    return this.requestWithPagination<MastodonStatus>(
      "/api/v1/timelines/home",
      params,
      signal,
    );
  }

  async getPublicTimeline(
    params?: MastodonPaginationParams & {
      local?: boolean;
      remote?: boolean;
      only_media?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    const searchParams = new URLSearchParams();
    if (params?.max_id) searchParams.set("max_id", params.max_id);
    if (params?.since_id) searchParams.set("since_id", params.since_id);
    if (params?.min_id) searchParams.set("min_id", params.min_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.local) searchParams.set("local", "true");
    if (params?.remote) searchParams.set("remote", "true");
    if (params?.only_media) searchParams.set("only_media", "true");

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timelines/public${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    const data = await response.json();
    const linkHeader = response.headers.get("Link");
    const links = parseLinkHeader(linkHeader);

    return {
      data,
      next: links.next ? extractMaxIdFromUrl(links.next) : undefined,
      prev: links.prev ? extractMaxIdFromUrl(links.prev) : undefined,
    };
  }

  async getTagTimeline(
    hashtag: string,
    params?: MastodonPaginationParams & {
      local?: boolean;
      only_media?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    const searchParams = new URLSearchParams();
    if (params?.max_id) searchParams.set("max_id", params.max_id);
    if (params?.since_id) searchParams.set("since_id", params.since_id);
    if (params?.min_id) searchParams.set("min_id", params.min_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.local) searchParams.set("local", "true");
    if (params?.only_media) searchParams.set("only_media", "true");

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/timelines/tag/${encodeURIComponent(hashtag)}${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    const data = await response.json();
    const linkHeader = response.headers.get("Link");
    const links = parseLinkHeader(linkHeader);

    return {
      data,
      next: links.next ? extractMaxIdFromUrl(links.next) : undefined,
      prev: links.prev ? extractMaxIdFromUrl(links.prev) : undefined,
    };
  }

  async getListTimeline(
    listId: string,
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    return this.requestWithPagination<MastodonStatus>(
      `/api/v1/timelines/list/${listId}`,
      params,
      signal,
    );
  }

  // Statuses

  async getStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "GET",
      `/api/v1/statuses/${id}`,
      undefined,
      signal,
    );
  }

  async getStatusContext(id: string, signal?: AbortSignal): Promise<MastodonContext> {
    return this.request<MastodonContext>(
      "GET",
      `/api/v1/statuses/${id}/context`,
      undefined,
      signal,
    );
  }

  async createStatus(params: CreateStatusParams, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>("POST", "/api/v1/statuses", params, signal);
  }

  async editStatus(
    id: string,
    params: Omit<CreateStatusParams, "scheduled_at">,
    signal?: AbortSignal,
  ): Promise<MastodonStatus> {
    return this.request<MastodonStatus>("PUT", `/api/v1/statuses/${id}`, params, signal);
  }

  async deleteStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>("DELETE", `/api/v1/statuses/${id}`, undefined, signal);
  }

  async favouriteStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/favourite`,
      undefined,
      signal,
    );
  }

  async unfavouriteStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/unfavourite`,
      undefined,
      signal,
    );
  }

  async reblogStatus(
    id: string,
    options?: { visibility?: "public" | "unlisted" | "private" },
    signal?: AbortSignal,
  ): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/reblog`,
      options,
      signal,
    );
  }

  async unreblogStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/unreblog`,
      undefined,
      signal,
    );
  }

  async bookmarkStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/bookmark`,
      undefined,
      signal,
    );
  }

  async unbookmarkStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/unbookmark`,
      undefined,
      signal,
    );
  }

  async muteConversation(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/mute`,
      undefined,
      signal,
    );
  }

  async unmuteConversation(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/unmute`,
      undefined,
      signal,
    );
  }

  async pinStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/pin`,
      undefined,
      signal,
    );
  }

  async unpinStatus(id: string, signal?: AbortSignal): Promise<MastodonStatus> {
    return this.request<MastodonStatus>(
      "POST",
      `/api/v1/statuses/${id}/unpin`,
      undefined,
      signal,
    );
  }

  // Favourites & Bookmarks

  async getFavourites(
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    return this.requestWithPagination<MastodonStatus>("/api/v1/favourites", params, signal);
  }

  async getBookmarks(
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonStatus>> {
    return this.requestWithPagination<MastodonStatus>("/api/v1/bookmarks", params, signal);
  }

  // Notifications

  async getNotifications(
    params?: MastodonPaginationParams & {
      types?: string[];
      exclude_types?: string[];
      account_id?: string;
    },
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonNotification>> {
    const searchParams = new URLSearchParams();
    if (params?.max_id) searchParams.set("max_id", params.max_id);
    if (params?.since_id) searchParams.set("since_id", params.since_id);
    if (params?.min_id) searchParams.set("min_id", params.min_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.types) {
      params.types.forEach((type) => searchParams.append("types[]", type));
    }
    if (params?.exclude_types) {
      params.exclude_types.forEach((type) => searchParams.append("exclude_types[]", type));
    }
    if (params?.account_id) searchParams.set("account_id", params.account_id);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/notifications${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, endpoint);
    }

    const data = await response.json();
    const linkHeader = response.headers.get("Link");
    const links = parseLinkHeader(linkHeader);

    return {
      data,
      next: links.next ? extractMaxIdFromUrl(links.next) : undefined,
      prev: links.prev ? extractMaxIdFromUrl(links.prev) : undefined,
    };
  }

  async getNotification(id: string, signal?: AbortSignal): Promise<MastodonNotification> {
    return this.request<MastodonNotification>(
      "GET",
      `/api/v1/notifications/${id}`,
      undefined,
      signal,
    );
  }

  async dismissNotification(id: string, signal?: AbortSignal): Promise<void> {
    return this.request<void>(
      "POST",
      `/api/v1/notifications/${id}/dismiss`,
      undefined,
      signal,
    );
  }

  async clearNotifications(signal?: AbortSignal): Promise<void> {
    return this.request<void>("POST", "/api/v1/notifications/clear", undefined, signal);
  }

  // Conversations (Direct Messages)

  async getConversations(
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonConversation>> {
    return this.requestWithPagination<MastodonConversation>(
      "/api/v1/conversations",
      params,
      signal,
    );
  }

  async deleteConversation(id: string, signal?: AbortSignal): Promise<void> {
    return this.request<void>("DELETE", `/api/v1/conversations/${id}`, undefined, signal);
  }

  async markConversationRead(id: string, signal?: AbortSignal): Promise<MastodonConversation> {
    return this.request<MastodonConversation>(
      "POST",
      `/api/v1/conversations/${id}/read`,
      undefined,
      signal,
    );
  }

  // Lists

  async getLists(signal?: AbortSignal): Promise<MastodonList[]> {
    return this.request<MastodonList[]>("GET", "/api/v1/lists", undefined, signal);
  }

  async getList(id: string, signal?: AbortSignal): Promise<MastodonList> {
    return this.request<MastodonList>("GET", `/api/v1/lists/${id}`, undefined, signal);
  }

  async createList(
    title: string,
    repliesPolicy?: "followed" | "list" | "none",
    exclusive?: boolean,
    signal?: AbortSignal,
  ): Promise<MastodonList> {
    return this.request<MastodonList>(
      "POST",
      "/api/v1/lists",
      { title, replies_policy: repliesPolicy, exclusive },
      signal,
    );
  }

  async updateList(
    id: string,
    title?: string,
    repliesPolicy?: "followed" | "list" | "none",
    exclusive?: boolean,
    signal?: AbortSignal,
  ): Promise<MastodonList> {
    return this.request<MastodonList>(
      "PUT",
      `/api/v1/lists/${id}`,
      { title, replies_policy: repliesPolicy, exclusive },
      signal,
    );
  }

  async deleteList(id: string, signal?: AbortSignal): Promise<void> {
    return this.request<void>("DELETE", `/api/v1/lists/${id}`, undefined, signal);
  }

  async getListAccounts(
    id: string,
    params?: MastodonPaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<MastodonAccount>> {
    return this.requestWithPagination<MastodonAccount>(
      `/api/v1/lists/${id}/accounts`,
      params,
      signal,
    );
  }

  async addAccountsToList(id: string, accountIds: string[], signal?: AbortSignal): Promise<void> {
    return this.request<void>(
      "POST",
      `/api/v1/lists/${id}/accounts`,
      { account_ids: accountIds },
      signal,
    );
  }

  async removeAccountsFromList(
    id: string,
    accountIds: string[],
    signal?: AbortSignal,
  ): Promise<void> {
    return this.request<void>(
      "DELETE",
      `/api/v1/lists/${id}/accounts`,
      { account_ids: accountIds },
      signal,
    );
  }

  // Search

  async search(
    q: string,
    params?: {
      type?: "accounts" | "hashtags" | "statuses";
      resolve?: boolean;
      following?: boolean;
      account_id?: string;
      exclude_unreviewed?: boolean;
      offset?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ): Promise<{
    accounts: MastodonAccount[];
    statuses: MastodonStatus[];
    hashtags: MastodonTag[];
  }> {
    const searchParams = new URLSearchParams({ q });
    if (params?.type) searchParams.set("type", params.type);
    if (params?.resolve) searchParams.set("resolve", "true");
    if (params?.following) searchParams.set("following", "true");
    if (params?.account_id) searchParams.set("account_id", params.account_id);
    if (params?.exclude_unreviewed) searchParams.set("exclude_unreviewed", "true");
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    return this.request(
      "GET",
      `/api/v2/search?${searchParams.toString()}`,
      undefined,
      signal,
    );
  }

  // Instance

  async getInstance(signal?: AbortSignal): Promise<MastodonInstance> {
    return this.request<MastodonInstance>("GET", "/api/v2/instance", undefined, signal);
  }

  // Media

  async uploadMedia(
    file: File | Blob,
    description?: string,
    focus?: string,
    signal?: AbortSignal,
  ): Promise<MastodonMediaAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    if (focus) formData.append("focus", focus);

    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await this.fetchFn(`${this.baseUrl}/api/v2/media`, {
      method: "POST",
      headers,
      body: formData,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MastodonError(response.status, errorText, "/api/v2/media");
    }

    return response.json();
  }

  async getMedia(id: string, signal?: AbortSignal): Promise<MastodonMediaAttachment> {
    return this.request<MastodonMediaAttachment>(
      "GET",
      `/api/v1/media/${id}`,
      undefined,
      signal,
    );
  }

  async updateMedia(
    id: string,
    description?: string,
    focus?: string,
    signal?: AbortSignal,
  ): Promise<MastodonMediaAttachment> {
    return this.request<MastodonMediaAttachment>(
      "PUT",
      `/api/v1/media/${id}`,
      { description, focus },
      signal,
    );
  }

  // Polls

  async votePoll(id: string, choices: number[], signal?: AbortSignal): Promise<MastodonPoll> {
    return this.request<MastodonPoll>(
      "POST",
      `/api/v1/polls/${id}/votes`,
      { choices },
      signal,
    );
  }

  // Trends

  async getTrendingStatuses(
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<MastodonStatus[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const queryString = searchParams.toString();
    return this.request<MastodonStatus[]>(
      "GET",
      `/api/v1/trends/statuses${queryString ? `?${queryString}` : ""}`,
      undefined,
      signal,
    );
  }

  async getTrendingTags(
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<MastodonTag[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const queryString = searchParams.toString();
    return this.request<MastodonTag[]>(
      "GET",
      `/api/v1/trends/tags${queryString ? `?${queryString}` : ""}`,
      undefined,
      signal,
    );
  }
}

export class MastodonError extends Error {
  status: number;
  endpoint: string;

  constructor(status: number, message: string, endpoint: string) {
    super(`Mastodon API error (${status}) at ${endpoint}: ${message}`);
    this.name = "MastodonError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

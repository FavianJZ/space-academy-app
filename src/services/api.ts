import type {
  ApiEnvelope,
  ApiPlayer,
  ApiPlayerProgress,
  ApiPlayerSettings,
  ApiGlobalLeaderboardEntry,
  ApiPlanetLeaderboardEntry,
  ApiBossStatus,
  ApiBossAttackResult,
  ApiMajor,
  ApiCharacter,
} from "../types/api.types";

// Vite env var - set VITE_API_URL in .env (see .env.example). Falls
// back to a local backend for dev convenience.
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchEnvelope<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // Network failure (offline, backend down, CORS, DNS...) - distinct
    // from a server-returned error so callers can tell them apart.
    throw new ApiError("Could not reach the server", 0);
  }

  let body: ApiEnvelope<T> | undefined;

  try {
    body = await response.json();
  } catch {
    // Non-JSON response (e.g. a proxy error page) - fall through with
    // no body, status check below still throws with a sane message.
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return body;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T | undefined> {
  const body = await fetchEnvelope<T>(path, options, token);

  return body.data;
}

// --- Auth / players ---

export interface CreatePlayerPayload {
  name: string;
  phone: string;
  school: string;
  major?: ApiMajor;
  character: ApiCharacter;
  p2Name?: string;
  p2Phone?: string;
}

export interface AuthResult {
  player: ApiPlayer;
  token: string;
  expiresAt: string;
}

async function createOrLoginPlayer(
  payload: CreatePlayerPayload
): Promise<AuthResult> {
  return requestWithAuth("/players", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function loginByPhone(phone: string): Promise<AuthResult> {
  return requestWithAuth("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

// These two endpoints return `data` (the player) AND a top-level `auth`
// block, which the generic `request()` helper discards - it only
// returns `data`. Small dedicated wrapper so those two callers get both.
async function requestWithAuth(
  path: string,
  options: RequestInit
): Promise<AuthResult> {
  const body = await fetchEnvelope<ApiPlayer>(path, options);

  if (!body.data || !body.auth) {
    throw new ApiError("Server response was missing player/auth data", 0);
  }

  return {
    player: body.data,
    token: body.auth.token,
    expiresAt: body.auth.expiresAt,
  };
}

async function getPlayer(id: string, token: string): Promise<ApiPlayer | undefined> {
  return request<ApiPlayer>(`/players/${id}`, {}, token);
}

export interface UpdateProfilePayload {
  spacemanColor?: string;
  spacemanHat?: string;
  spacemanPet?: string;
  p2Name?: string;
  p2Phone?: string;
}

async function updatePlayerProfile(
  id: string,
  token: string,
  payload: UpdateProfilePayload
): Promise<ApiPlayer | undefined> {
  return request<ApiPlayer>(
    `/players/${id}/profile`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

// --- Progress ---

export interface SubmitProgressPayload {
  planetId: number;
  stageId: number;
  score: number;
  completionTime?: number;
  completed: boolean;
}

async function submitStageProgress(
  token: string,
  payload: SubmitProgressPayload
): Promise<ApiPlayerProgress | undefined> {
  return request<ApiPlayerProgress>(
    "/progress/stage",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

async function getPlayerProgress(
  playerId: string,
  token: string
): Promise<ApiPlayerProgress[] | undefined> {
  return request<ApiPlayerProgress[]>(
    `/progress/player/${playerId}`,
    {},
    token
  );
}

// --- Settings ---

async function getPlayerSettings(
  playerId: string,
  token: string
): Promise<ApiPlayerSettings | undefined> {
  return request<ApiPlayerSettings>(`/settings/player/${playerId}`, {}, token);
}

async function updatePlayerSettings(
  playerId: string,
  token: string,
  payload: { musicVolume?: number; sfxVolume?: number }
): Promise<ApiPlayerSettings | undefined> {
  return request<ApiPlayerSettings>(
    `/settings/player/${playerId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

// --- Boss ---

async function getBossStatus(): Promise<ApiBossStatus | undefined> {
  return request<ApiBossStatus>("/boss/status");
}

async function attackBoss(
  token: string,
  damage: number
): Promise<ApiBossAttackResult | undefined> {
  return request<ApiBossAttackResult>(
    "/boss/damage",
    { method: "POST", body: JSON.stringify({ damage }) },
    token
  );
}

// --- Leaderboard ---

async function getGlobalLeaderboard(
  limit = 50
): Promise<ApiGlobalLeaderboardEntry[] | undefined> {
  return request<ApiGlobalLeaderboardEntry[]>(
    `/leaderboard/global?limit=${limit}`
  );
}

async function getPlanetLeaderboard(
  planetId: number,
  limit = 20
): Promise<ApiPlanetLeaderboardEntry[] | undefined> {
  return request<ApiPlanetLeaderboardEntry[]>(
    `/leaderboard/planet/${planetId}?limit=${limit}`
  );
}

export const api = {
  createOrLoginPlayer,
  loginByPhone,
  getPlayer,
  updatePlayerProfile,
  submitStageProgress,
  getPlayerProgress,
  getPlayerSettings,
  updatePlayerSettings,
  getBossStatus,
  attackBoss,
  getGlobalLeaderboard,
  getPlanetLeaderboard,
};

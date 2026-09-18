import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getLocalDeviceId } from "./deviceAccountService";

const PLAYER_ID_KEY = "space-academy-player-id";

export const getLocalPlayerId = (): string | null =>
  localStorage.getItem(PLAYER_ID_KEY);

export const setLocalPlayerId = (id: string): void =>
  localStorage.setItem(PLAYER_ID_KEY, id);

interface RegisterData {
  name: string;
  phone?: string;
  school?: string;
  major?: string;
  character_type?: string;
  spaceman_color?: string;
  spaceman_hat?: string;
  spaceman_pet?: string;
  specialization_result?: import("../types/specialization.types").SpecializationResult | null;
  device_id?: string;
}

export async function registerPlayer(
  data: RegisterData
): Promise<string | null> {
  if (!isSupabaseEnabled()) {
    console.warn(
      "[playerService] Supabase tidak aktif. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diset di Vercel."
    );
    return null;
  }

  const cleanName = data.name.trim();
  const cleanPhone = (data.phone || "").trim();

const localId = getLocalPlayerId();
  if (localId) {
    const { data: existingLocal } = await supabase!
      .from("players")
      .select("id")
      .eq("id", localId)
      .maybeSingle();

    if (existingLocal?.id) {
      console.log("[playerService] Profil perangkat ditemukan. Mengupdate data:", existingLocal.id);
      await updatePlayer(existingLocal.id, data);
      return existingLocal.id;
    }
  }

if (cleanPhone && cleanPhone !== "EMPTY" && cleanPhone !== "-") {
    const { data: existingByPhone } = await supabase!
      .from("players")
      .select("id")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingByPhone?.id) {
      console.log("[playerService] Pemain ditemukan via Nomor HP. Re-login/update:", existingByPhone.id);
      setLocalPlayerId(existingByPhone.id);
      await updatePlayer(existingByPhone.id, data);
      return existingByPhone.id;
    }
  }

if (cleanName) {
    const { data: existingByName } = await supabase!
      .from("players")
      .select("id")
      .ilike("name", cleanName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingByName?.id) {
      console.log("[playerService] Pemain ditemukan via Nama. Re-login/update:", existingByName.id);
      setLocalPlayerId(existingByName.id);
      await updatePlayer(existingByName.id, data);
      return existingByName.id;
    }
  }

  const insertPayload: Record<string, unknown> = {
    name: cleanName,
    phone: cleanPhone,
    school: data.school || "",
    major: data.major || "",
    character_type: data.character_type || "pink",
    spaceman_color: data.spaceman_color || "original",
    spaceman_hat: data.spaceman_hat || "none",
    spaceman_pet: data.spaceman_pet || "none",
    device_id: data.device_id || getLocalDeviceId(),
  };

  let { data: row, error } = await supabase!
    .from("players")
    .insert(insertPayload)
    .select("id")
    .single();

  // If column device_id does not exist in Supabase schema, retry without device_id
  if (error && (error.code === "PGRST204" || error.message?.includes("device_id"))) {
    console.warn("[playerService] Supabase schema does not have 'device_id' column. Retrying insert without device_id...");
    delete insertPayload.device_id;
    const retry = await supabase!
      .from("players")
      .insert(insertPayload)
      .select("id")
      .single();
    row = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("[playerService] Register player gagal di Supabase:", error.message);
    return null;
  }

  const id = (row as { id: string }).id;
  setLocalPlayerId(id);
  console.log("[playerService] Berhasil mendaftarkan player baru di Supabase! ID:", id);
  return id;
}

export async function updatePlayer(
  playerId: string,
  data: Partial<RegisterData>
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    device_id: data.device_id || getLocalDeviceId(),
  };

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.phone !== undefined) payload.phone = data.phone.trim();
  if (data.school !== undefined) payload.school = data.school.trim();
  if (data.major !== undefined) payload.major = data.major;
  if (data.character_type !== undefined) payload.character_type = data.character_type;
  if (data.spaceman_color !== undefined) payload.spaceman_color = data.spaceman_color;
  if (data.spaceman_hat !== undefined) payload.spaceman_hat = data.spaceman_hat;
  if (data.spaceman_pet !== undefined) payload.spaceman_pet = data.spaceman_pet;
  if (data.specialization_result !== undefined) payload.specialization_result = data.specialization_result;

  let { error } = await supabase!
    .from("players")
    .update(payload)
    .eq("id", playerId);

  // If update fails because device_id column does not exist, retry without device_id
  if (error && (error.code === "PGRST204" || error.message?.includes("device_id"))) {
    console.warn("[playerService] Supabase schema does not have 'device_id'. Retrying update without device_id...");
    delete payload.device_id;
    const retry = await supabase!
      .from("players")
      .update(payload)
      .eq("id", playerId);
    error = retry.error;
  }

  if (error) {
    console.error("[playerService] update failed:", error.message);
    return false;
  }

  return true;
}

export async function markIntroCompleted(playerId: string): Promise<void> {
  await updatePlayer(playerId, {});
  if (!isSupabaseEnabled()) return;
  await supabase!
    .from("players")
    .update({ intro_completed: true, updated_at: new Date().toISOString() })
    .eq("id", playerId);
}

export async function markGameCompleted(playerId: string): Promise<void> {
  if (!isSupabaseEnabled()) return;
  await supabase!
    .from("players")
    .update({ game_completed: true, updated_at: new Date().toISOString() })
    .eq("id", playerId);
}

export async function updateCustomization(
  playerId: string,
  opts: {
    character_type?: string;
    spaceman_color?: string;
    spaceman_hat?: string;
    spaceman_pet?: string;
  }
): Promise<void> {
  if (!isSupabaseEnabled()) return;
  await supabase!
    .from("players")
    .update({ ...opts, updated_at: new Date().toISOString() })
    .eq("id", playerId);
}

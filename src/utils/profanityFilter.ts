
const PROFANITY_PATTERNS: RegExp[] = [
  
  /\b(kontol|kntl|kntol|kndol|memek|mmk|memeq|pepek|ppk|puki|pukimak|kimak|kmk|titit|titiw|kintil|itil)\b/i,
  /\b(ngentot|ngentd|entot|nentot|ngewe|ngew|sange|sangek|bocil_sange|tobrut|colli|colly|pepek)\b/i,
  /\b(lonte|lnt|perek|prk|lonteh|sundal|pelacur|jablay|jbl)\b/i,
  
  /\b(anjing|anjrit|anjay|njing|njir|njo|babi|bafek|bangsat|bsat|bgst|bajingan|bjngn|asu|asuu)\b/i,
  /\b(jancok|jancuk|cok|cuk|coeg|kampang|pantek|panteq)\b/i,
  /\b(goblok|gblk|goblq|tolol|tlol|bego|panteq|tai|taee|berak)\b/i,

  /\b(fuck|fck|fuk|fukin|fucking|fucker|shit|shitt|asshole|ass|bastard|bitch|btch|whore|slut|cunt|dick|cock|pussy|nigger|nigga|retard)\b/i,

  /\b(k[0o]nt[0o]l|kntlh?|m[3e]m[3e]k|p[3e]p[3e]k|ng[3e]nt[0o]t|b[4a]b[1i]|[4a]nj[1i]ng|b[4a]ngs[4a]t|j[4a]nc[0o]k|g[0o]bl[0o]k)\b/i,
  /\b(f[*u]ck|[a4]ssh[0o]l[3e]|b[*i]tch|p[*u]ssy|d[*i]ck)\b/i,
];

export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  
  const normalized = text
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[$]/g, "s")
    .replace(/[!1i]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5]/g, "s");

  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(normalized));
}

export function validateAppropriateText(text: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Data tidak boleh kosong." };
  }

  if (containsProfanity(trimmed)) {
    return {
      isValid: false,
      errorMessage: "🚫 Nama / data mengandung kata yang tidak sopan. Harap gunakan kata yang baik!",
    };
  }

  return { isValid: true };
}

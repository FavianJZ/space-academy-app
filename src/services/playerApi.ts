import { apiFetch } from "./api";

export const createPlayer = async (playerData: {
  name: string;
  phone: string;
  school: string;
  major: "IPA" | "IPS";
  character: "pink" | "white";
}) => {
  return apiFetch("/players", {
    method: "POST",
    body: JSON.stringify(playerData),
  });
};
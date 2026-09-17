import { jsPDF } from "jspdf";
import type {
  SpecializationResult,
  TelemetrySignals,
} from "../types/specialization.types";
import { ARCHETYPE_METAS } from "../utils/specializationCalculator";
import { generateCadetPersonalityProfile } from "../utils/cadetPersonalityEngine";
import {
  getSpacemanColorOption,
  getSpacemanHatOption,
  getSpacemanPetOption,
} from "../constants/characterCustomization.constants";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../types/customization.types";
import type { Character } from "../types/game.types";

interface CadetIdentity {
  name: string;
  school: string;
  major: string;
}

export interface CadetLoadout {
  character: Character;
  colorId: SpacemanColorId;
  hatId: SpacemanHatId;
  petId: SpacemanPetId;
}

export async function generateCadetCardPdf(
  cadet: CadetIdentity,
  result: SpecializationResult,
  loadout?: CadetLoadout,
  signals?: TelemetrySignals
): Promise<void> {
  const cardWidth = 1600;
  const cardHeight = 1000;

  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to initialize canvas 2D context");
  }

  const primaryMeta = ARCHETYPE_METAS[result.primaryArchetype];
  const secondaryMeta = ARCHETYPE_METAS[result.secondaryArchetype];

  const colorOpt = loadout ? getSpacemanColorOption(loadout.colorId) : null;
  const hatOpt = loadout ? getSpacemanHatOption(loadout.hatId) : null;
  const petOpt = loadout ? getSpacemanPetOption(loadout.petId) : null;

  const suitColorHex = colorOpt?.modelColor ?? (loadout?.character === "pink" ? "#f46bad" : "#77eaff");
  const petAccentHex = petOpt && loadout?.petId !== "none" ? petOpt.accent : "#7595a0";

  // Helper rounded rect
  const drawRoundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string | CanvasGradient | CanvasPattern,
    stroke?: string | CanvasGradient | CanvasPattern,
    strokeWidth = 1
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  // Helper radial glow
  const drawGlow = (cx: number, cy: number, r: number, color: string) => {
    const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rad.addColorStop(0, color);
    rad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1. Card Shell Background (Deep Aerospace Obsidian Carbon Glass)
  const bgGrad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
  bgGrad.addColorStop(0, "#030712");
  bgGrad.addColorStop(0.3, "#071329");
  bgGrad.addColorStop(0.7, "#0b1c3a");
  bgGrad.addColorStop(1, "#02050f");
  drawRoundedRect(0, 0, cardWidth, cardHeight, 26, bgGrad);

  // Precision Sci-Fi Coordinate Grid
  ctx.strokeStyle = "rgba(0, 255, 204, 0.035)";
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < cardWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cardHeight);
    ctx.stroke();
  }
  for (let y = 0; y < cardHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cardWidth, y);
    ctx.stroke();
  }

  // Ambient Glowing Hologram Nebulae
  drawGlow(294, 450, 480, "rgba(0, 255, 204, 0.12)");
  drawGlow(1250, 320, 500, "rgba(170, 102, 255, 0.11)");
  drawGlow(cardWidth / 2, cardHeight - 120, 450, "rgba(0, 204, 255, 0.08)");
  drawGlow(750, 220, 300, "rgba(255, 143, 201, 0.06)");

  // 2. Dual Glowing Cyber Outer Borders with Chamfered Tech Accents
  ctx.strokeStyle = "rgba(126, 249, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, cardWidth - 40, cardHeight - 40);

  ctx.strokeStyle = "rgba(0, 255, 204, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, cardWidth - 60, cardHeight - 60);

  // Sci-Fi Corner Brackets
  const cornerLength = 42;
  const drawCornerBracket = (x: number, y: number, dx: number, dy: number) => {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * cornerLength, y);
    ctx.stroke();

    // Minor decorative cyber ticks
    ctx.strokeStyle = "rgba(126, 249, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx * 8, y + dy * (cornerLength + 6));
    ctx.lineTo(x + dx * 8, y + dy * (cornerLength + 16));
    ctx.moveTo(x + dx * (cornerLength + 6), y + dy * 8);
    ctx.lineTo(x + dx * (cornerLength + 16), y + dy * 8);
    ctx.stroke();
  };
  drawCornerBracket(20, 20, 1, 1);
  drawCornerBracket(cardWidth - 20, 20, -1, 1);
  drawCornerBracket(20, cardHeight - 20, 1, -1);
  drawCornerBracket(cardWidth - 20, cardHeight - 20, -1, -1);

  // Iridescent Holographic Foil Header Strip (Laser sheen across top)
  const foilGrad = ctx.createLinearGradient(48, 0, cardWidth - 48, 0);
  foilGrad.addColorStop(0, "rgba(0, 255, 204, 0.8)");
  foilGrad.addColorStop(0.25, "rgba(0, 204, 255, 0.9)");
  foilGrad.addColorStop(0.5, "rgba(170, 102, 255, 0.9)");
  foilGrad.addColorStop(0.75, "rgba(255, 110, 199, 0.85)");
  foilGrad.addColorStop(1, "rgba(255, 215, 0, 0.8)");
  ctx.fillStyle = foilGrad;
  ctx.fillRect(48, 30, cardWidth - 96, 3);

  // 3. Card Top Header Bar
  // Smart Security Microchip Graphic (Golden cyber contact pads)
  const chipX = 52;
  const chipY = 46;
  const chipW = 56;
  const chipH = 44;
  drawRoundedRect(chipX, chipY, chipW, chipH, 8, "rgba(255, 215, 0, 0.16)", "#ffd700", 1.8);
  ctx.strokeStyle = "rgba(255, 215, 0, 0.75)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(chipX, chipY + chipH / 2);
  ctx.lineTo(chipX + chipW, chipY + chipH / 2);
  ctx.moveTo(chipX + chipW / 3, chipY);
  ctx.lineTo(chipX + chipW / 3, chipY + chipH);
  ctx.moveTo(chipX + (chipW * 2) / 3, chipY);
  ctx.lineTo(chipX + (chipW * 2) / 3, chipY + chipH);
  ctx.stroke();

  // Central micro contact circuit node
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(chipX + chipW / 2, chipY + chipH / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Header Title & Institution Metadata
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.letterSpacing = "3px";
  ctx.fillText("SPACE ACADEMY // CADET SPECIALIZATION PASS", 124, 64);

  ctx.fillStyle = "#a1c2e4";
  ctx.font = "600 11px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.6px";
  ctx.fillText("SCHOOL OF COMPUTER SCIENCE (SOCS) • BINUS UNIVERSITY BEKASI", 124, 82);

  // Status Badge (Top Right)
  const isCertified = result.confidenceLevel >= 100;
  const statusBg = isCertified ? "rgba(0, 255, 204, 0.14)" : "rgba(255, 170, 0, 0.14)";
  const statusStroke = isCertified ? "#00ffcc" : "#ffaa00";
  const statusColor = isCertified ? "#00ffcc" : "#ffbb33";
  const statusLabel = isCertified
    ? "● STATUS: CERTIFIED PILOT"
    : "● STATUS: ACTIVE CADET IN TRAINING";

  drawRoundedRect(cardWidth - 350, 48, 296, 40, 8, statusBg, statusStroke, 1.5);
  ctx.fillStyle = statusColor;
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1.2px";
  ctx.fillText(statusLabel, cardWidth - 202, 73);

  // Divider Line with central accent
  ctx.strokeStyle = "rgba(126, 249, 255, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(52, 106);
  ctx.lineTo(cardWidth - 52, 106);
  ctx.stroke();

  // 4. Main Two-Column Layout (H: 816)
  // LEFT COLUMN: Avatar & Pet Hologram Chamber (X: 52, W: 484, Y: 120, H: 816)
  // RIGHT COLUMN: Cadet Dossier, Archetypes & Telemetry (X: 562, W: 986, Y: 120, H: 816)
  const leftX = 52;
  const leftW = 484;
  const rightX = 560;
  const rightW = cardWidth - rightX - 52; // 988
  const mainY = 120;
  const mainH = 816;

  // ─────────────────────────────────────────────────────────────
  // LEFT: AVATAR & PET HOLOGRAM CHAMBER
  // ─────────────────────────────────────────────────────────────
  drawRoundedRect(leftX, mainY, leftW, mainH, 18, "rgba(6, 14, 32, 0.78)", "rgba(0, 255, 204, 0.38)", 1.5);

  // Chamber Header Bar
  drawRoundedRect(leftX + 16, mainY + 14, leftW - 32, 34, 7, "rgba(0, 255, 204, 0.12)", "rgba(0, 255, 204, 0.32)");
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("BIOMETRIC AVATAR & PET LINK", leftX + leftW / 2, mainY + 36);

  // Hologram Chamber Viewport Glass
  const viewX = leftX + 16;
  const viewY = mainY + 56;
  const viewW = leftW - 32; // 452
  const viewH = 550; // Increased height for prominent avatar showcase!

  const chamberGlassGrad = ctx.createLinearGradient(viewX, viewY, viewX, viewY + viewH);
  chamberGlassGrad.addColorStop(0, "rgba(4, 10, 26, 0.95)");
  chamberGlassGrad.addColorStop(0.5, "rgba(7, 18, 42, 0.9)");
  chamberGlassGrad.addColorStop(1, "rgba(3, 8, 20, 0.98)");
  drawRoundedRect(viewX, viewY, viewW, viewH, 12, chamberGlassGrad, "rgba(126, 249, 255, 0.25)", 1.5);

  // Pedestal platform surface elevation & center
  const pedCenterX = leftX + leftW / 2;
  const pedY = viewY + viewH - 42;

  // Tactical Scanlines in chamber viewport
  ctx.strokeStyle = "rgba(0, 255, 204, 0.045)";
  ctx.lineWidth = 1;
  for (let y = viewY; y < viewY + viewH; y += 18) {
    ctx.beginPath();
    ctx.moveTo(viewX, y);
    ctx.lineTo(viewX + viewW, y);
    ctx.stroke();
  }

  // Tactical HUD Corner Reticles on Viewport
  const drawReticle = (rx: number, ry: number, rdx: number, rdy: number) => {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, ry + rdy * 16);
    ctx.lineTo(rx, ry);
    ctx.lineTo(rx + rdx * 16, ry);
    ctx.stroke();
  };
  drawReticle(viewX + 8, viewY + 8, 1, 1);
  drawReticle(viewX + viewW - 8, viewY + 8, -1, 1);
  drawReticle(viewX + 8, viewY + viewH - 8, 1, -1);
  drawReticle(viewX + viewW - 8, viewY + viewH - 8, -1, -1);

  // HUD Info Overlay top of chamber
  ctx.fillStyle = "rgba(126, 249, 255, 0.75)";
  ctx.font = "bold 9px 'Consolas', monospace";
  ctx.textAlign = "left";
  ctx.fillText("HOLO-SYS: V4.8 // 60 FPS", viewX + 16, viewY + 22);
  ctx.textAlign = "right";
  ctx.fillText("BEACON-01 LINKED", viewX + viewW - 16, viewY + 22);

  // 3D Perspective Glowing Pedestal Rings (Drawn UNDER the avatar feet)
  // Outer glowing ring
  ctx.beginPath();
  ctx.ellipse(pedCenterX, pedY, 185, 40, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 255, 204, 0.12)";
  ctx.fill();
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Middle ring
  ctx.beginPath();
  ctx.ellipse(pedCenterX, pedY, 135, 26, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(170, 102, 255, 0.75)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner core glow ellipse
  ctx.beginPath();
  ctx.ellipse(pedCenterX, pedY, 80, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 255, 204, 0.25)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Platform Degree Compass Markers
  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 8px 'Consolas', monospace";
  ctx.textAlign = "center";
  ctx.fillText("000°", pedCenterX, pedY + 36);
  ctx.fillText("180°", pedCenterX, pedY - 32);
  ctx.fillText("270°", pedCenterX - 170, pedY + 4);
  ctx.fillText("090°", pedCenterX + 170, pedY + 4);

  // Try to capture HD 3D avatar canvas or standard canvas
  let hasDrawnAvatar = false;
  try {
    const hdCanvas = document.querySelector(
      ".cadet-card-hd-canvas canvas"
    ) as HTMLCanvasElement | null;
    const beaconCanvas = document.querySelector(
      ".character-avatar-canvas canvas"
    ) as HTMLCanvasElement | null;

    const avatarCanvas = (hdCanvas && hdCanvas.width > 0) ? hdCanvas : beaconCanvas;

    if (avatarCanvas && avatarCanvas.width > 0 && avatarCanvas.height > 0) {
      // Find exact non-transparent bounding box of 3D characters
      let cropMinX = avatarCanvas.width;
      let cropMaxX = 0;
      let cropMinY = avatarCanvas.height;
      let cropMaxY = 0;
      let pixelsFound = false;

      const scanForPixels = () => {
        try {
          const scanCanvas = document.createElement("canvas");
          const scaleDown = Math.min(1, 400 / Math.max(avatarCanvas.width, avatarCanvas.height));
          scanCanvas.width = Math.max(10, Math.round(avatarCanvas.width * scaleDown));
          scanCanvas.height = Math.max(10, Math.round(avatarCanvas.height * scaleDown));
          const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
          if (scanCtx) {
            scanCtx.drawImage(avatarCanvas, 0, 0, scanCanvas.width, scanCanvas.height);
            const imgData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
            const d = imgData.data;
            let sMinX = scanCanvas.width;
            let sMaxX = 0;
            let sMinY = scanCanvas.height;
            let sMaxY = 0;
            let found = false;

            for (let y = 0; y < scanCanvas.height; y += 2) {
              for (let x = 0; x < scanCanvas.width; x += 2) {
                const alpha = d[(y * scanCanvas.width + x) * 4 + 3];
                if (alpha > 8) {
                  if (x < sMinX) sMinX = x;
                  if (x > sMaxX) sMaxX = x;
                  if (y < sMinY) sMinY = y;
                  if (y > sMaxY) sMaxY = y;
                  found = true;
                }
              }
            }

            if (found && sMaxX > sMinX + 10 && sMaxY > sMinY + 10) {
              cropMinX = sMinX / scaleDown;
              cropMaxX = sMaxX / scaleDown;
              cropMinY = sMinY / scaleDown;
              cropMaxY = sMaxY / scaleDown;
              pixelsFound = true;
            }
          }
        } catch (scanErr) {
          console.warn("Pixel bounding box scan skipped:", scanErr);
        }
      };

      scanForPixels();
      if (!pixelsFound) {
        await new Promise((r) => setTimeout(r, 200));
        scanForPixels();
      }

      // If scan found valid character region, pad it cleanly
      let sX: number;
      let sY: number;
      let sW: number;
      let sH: number;

      if (pixelsFound && cropMaxX > cropMinX + 20 && cropMaxY > cropMinY + 20) {
        const w = cropMaxX - cropMinX;
        const h = cropMaxY - cropMinY;
        const padX = w * 0.06;
        const padYTop = h * 0.06;
        const padYBottom = 18; // Generous margin so pet claws, paws, and feet are never clipped

        sX = Math.max(0, cropMinX - padX);
        sY = Math.max(0, cropMinY - padYTop);
        sW = Math.min(avatarCanvas.width - sX, cropMaxX + padX - sX);
        sH = Math.min(avatarCanvas.height - sY, cropMaxY + padYBottom - sY);
      } else {
        const isHd = avatarCanvas === hdCanvas;
        sX = isHd ? avatarCanvas.width * 0.05 : avatarCanvas.width * 0.12;
        sY = isHd ? avatarCanvas.height * 0.05 : avatarCanvas.height * 0.20;
        sW = isHd ? avatarCanvas.width * 0.90 : avatarCanvas.width * 0.78;
        sH = isHd ? avatarCanvas.height * 0.90 : avatarCanvas.height * 0.75;
      }

      // Proportional scale: target height 320px for high-impact presence in chamber
      const targetHeight = 320;
      let destH = targetHeight;
      let destW = (sW / sH) * destH;

      // Ensure width fits comfortably inside viewport with padding
      if (destW > viewW - 36) {
        destW = viewW - 36;
        destH = (sH / sW) * destW;
      }

      const destX = pedCenterX - destW / 2;
      // Anchor characters naturally on top of the pedestal surface
      const footLevelY = pedY - 14;
      const destY = footLevelY - destH;

      // Enable high-quality image smoothing for crystal-clear HD output
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Render the zoomed & cropped 3D astronaut + pet
      ctx.drawImage(avatarCanvas, sX, sY, sW, sH, destX, destY, destW, destH);
      hasDrawnAvatar = true;
    }
  } catch (e) {
    console.warn("Could not capture 3D avatar canvas:", e);
  }

  // High-Tech Stylized Vector Spaceman + Pet Illustration (Fallback at 2.5x Scale)
  if (!hasDrawnAvatar) {
    const avX = pedCenterX - (loadout?.petId !== "none" ? 54 : 0);
    const avY = pedY - 370;

    // Outer cyber shield / glow
    drawGlow(avX, avY + 160, 160, "rgba(0, 255, 204, 0.15)");

    // Astronaut Legs & Boots
    drawRoundedRect(avX - 42, avY + 260, 36, 95, 12, "#1b283d", "#00ffcc", 2);
    drawRoundedRect(avX + 6, avY + 260, 36, 95, 12, "#1b283d", "#00ffcc", 2);
    // Heavy Boots
    drawRoundedRect(avX - 48, avY + 335, 44, 26, 8, suitColorHex, "#ffffff", 2);
    drawRoundedRect(avX + 4, avY + 335, 44, 26, 8, suitColorHex, "#ffffff", 2);

    // Torso Armor & Flight Suit
    drawRoundedRect(avX - 62, avY + 130, 124, 140, 26, suitColorHex, "#ffffff", 2.5);
    // Chest Arc Reactor Core
    drawRoundedRect(avX - 28, avY + 155, 56, 32, 8, "rgba(0, 255, 204, 0.25)", "#00ffcc", 1.8);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CADET", avX, avY + 175);

    // Helmet & Panoramic Visor
    drawRoundedRect(avX - 74, avY + 15, 148, 125, 48, suitColorHex, "#ffffff", 3);
    // Visor Glass with Cyber Gradient
    const visorGrad = ctx.createLinearGradient(avX - 58, avY + 40, avX + 58, avY + 115);
    visorGrad.addColorStop(0, "#00ffcc");
    visorGrad.addColorStop(0.4, "#7ef9ff");
    visorGrad.addColorStop(1, "#006699");
    drawRoundedRect(avX - 58, avY + 38, 116, 78, 28, visorGrad, "#ffffff", 2);

    // Visor Specular Reflection Sheen
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(avX - 22, avY + 58, 24, 10, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // If hat equipped, render golden crown / tactical headwear
    if (hatOpt && hatOpt.id !== "none") {
      drawRoundedRect(avX - 58, avY - 24, 116, 34, 8, "rgba(255, 215, 0, 0.3)", "#ffd700", 2);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`👑 ${hatOpt.shortLabel}`, avX, avY);
    }

    // Companion Pet (Enlarged alongside pilot)
    if (petOpt && loadout?.petId !== "none") {
      const pX = pedCenterX + 115;
      const pY = pedY - 140;

      // Pet glowing elemental aura
      drawGlow(pX, pY, 70, petAccentHex + "55");
      ctx.beginPath();
      ctx.arc(pX, pY, 56, 0, Math.PI * 2);
      ctx.strokeStyle = petAccentHex;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pet main body
      drawRoundedRect(pX - 38, pY - 38, 76, 76, 20, petAccentHex, "#ffffff", 2);
      // Pet expressive eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pX - 14, pY - 10, 8, 0, Math.PI * 2);
      ctx.arc(pX + 14, pY - 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#030712";
      ctx.beginPath();
      ctx.arc(pX - 14, pY - 10, 4, 0, Math.PI * 2);
      ctx.arc(pX + 14, pY - 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pet classification badge
      drawRoundedRect(pX - 55, pY + 48, 110, 24, 6, "rgba(0,0,0,0.7)", petAccentHex, 1.2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(petOpt.shortLabel, pX, pY + 64);
    }
  }

  // Loadout Matrix Specifications Box (Bottom of Left Column)
  const loadoutBoxY = viewY + viewH + 12;
  const loadoutBoxH = mainH - (loadoutBoxY - mainY) - 14;
  drawRoundedRect(viewX, loadoutBoxY, viewW, loadoutBoxH, 10, "rgba(0, 255, 204, 0.05)", "rgba(126, 249, 255, 0.22)", 1.2);

  // 4 Modular Spec Cells in 2x2 Grid for Clean Futuristic Layout
  const cellW = (viewW - 18) / 2;
  const cellH = (loadoutBoxH - 18) / 2;

  const drawSpecCell = (cx: number, cy: number, tag: string, label: string, val: string, dotColor?: string) => {
    drawRoundedRect(cx, cy, cellW, cellH, 6, "rgba(4, 12, 30, 0.65)", "rgba(0, 255, 204, 0.12)", 1);

    ctx.textAlign = "left";
    ctx.fillStyle = "#6e94b7";
    ctx.font = "bold 9px 'Consolas', monospace";
    ctx.fillText(tag, cx + 10, cy + 16);

    ctx.fillStyle = "#8baacb";
    ctx.font = "600 10px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(label, cx + 10, cy + 32);

    if (dotColor) {
      ctx.beginPath();
      ctx.arc(cx + 14, cy + 48, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
    const textOffset = dotColor ? 26 : 10;
    const shortVal = val.length > 18 ? val.slice(0, 16) + "..." : val;
    ctx.fillText(shortVal, cx + textOffset, cy + 52);
  };

  const suitName = colorOpt?.label || (loadout?.character === "pink" ? "Nova Pink" : "Lunar White");
  const hatName = hatOpt && hatOpt.id !== "none" ? hatOpt.label : "Standard Flight Helmet";
  const petName = petOpt && loadout?.petId !== "none" ? petOpt.label : "Solo Flight Mode";
  const flightFrame = loadout?.character === "pink" ? "Mark-IV Agility Frame" : "Mark-IV Heavy Titan";

  drawSpecCell(viewX + 6, loadoutBoxY + 6, "[LOADOUT-01]", "SUIT VARIANT", suitName, suitColorHex);
  drawSpecCell(viewX + 6 + cellW + 6, loadoutBoxY + 6, "[LOADOUT-02]", "HEADWEAR", hatName, "#ffd700");
  drawSpecCell(viewX + 6, loadoutBoxY + 6 + cellH + 6, "[LOADOUT-03]", "COMPANION PET", petName, petAccentHex);
  drawSpecCell(viewX + 6 + cellW + 6, loadoutBoxY + 6 + cellH + 6, "[LOADOUT-04]", "FLIGHT SYSTEM", flightFrame, "#00ffcc");

  // ─────────────────────────────────────────────────────────────
  // RIGHT: CADET INTELLIGENCE & TELEMETRY
  // ─────────────────────────────────────────────────────────────
  drawRoundedRect(rightX, mainY, rightW, mainH, 18, "rgba(6, 14, 32, 0.78)", "rgba(126, 249, 255, 0.25)", 1.5);

  // 1. Cadet Identity Header
  ctx.textAlign = "left";
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("CADET CLASSIFICATION & TELEMETRY RECORD", rightX + 32, mainY + 36);

  // Cadet Full Name (Prominent & High Contrast)
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1px";
  const nameDisplay = (cadet.name || "UNKNOWN CADET").toUpperCase();
  ctx.fillText(nameDisplay, rightX + 32, mainY + 76);

  // Identity Badges (School, Major, Cadet ID)
  const schoolStr = cadet.school ? `SCHOOL: ${cadet.school.toUpperCase()}` : "SCHOOL: SPACE ACADEMY";
  const majorStr = cadet.major ? `MAJOR: ${cadet.major.toUpperCase()}` : "MAJOR: SCIENCE & TECH";
  const cadetIdStr = `CADET ID: #SA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const drawBadgePill = (bx: number, by: number, bw: number, text: string) => {
    drawRoundedRect(bx, by, bw, 24, 5, "rgba(0, 204, 255, 0.08)", "rgba(0, 204, 255, 0.3)", 1);
    ctx.fillStyle = "#8dc9ff";
    ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, bx + bw / 2, by + 16);
  };

  drawBadgePill(rightX + 32, mainY + 92, 175, schoolStr);
  drawBadgePill(rightX + 215, mainY + 92, 145, majorStr);
  drawBadgePill(rightX + 368, mainY + 92, 170, cadetIdStr);

  // Assessment Confidence Meter Bar
  const confTrackW = rightW - 64;
  const confY = mainY + 128;
  drawRoundedRect(rightX + 32, confY, confTrackW, 10, 5, "rgba(255,255,255,0.08)", "rgba(126,249,255,0.15)");
  const confFill = Math.max(24, confTrackW * (result.confidenceLevel / 100));
  const confFillGrad = ctx.createLinearGradient(rightX + 32, 0, rightX + 32 + confFill, 0);
  confFillGrad.addColorStop(0, "#00ffcc");
  confFillGrad.addColorStop(0.6, "#00ccff");
  confFillGrad.addColorStop(1, "#aa66ff");
  drawRoundedRect(rightX + 32, confY, confFill, 10, 5, confFillGrad);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    `TELEMETRY CONFIDENCE: ${result.confidenceLevel}% — ${result.milestoneReached.toUpperCase()}`,
    rightX + 32,
    confY + 28
  );

  // 2. Dual Archetypes Display (Side-by-side Cyber Cards)
  const archY = mainY + 174;
  const archW = (rightW - 76) / 2; // ~456
  const archH = 132;

  // Primary Archetype Card
  drawRoundedRect(rightX + 32, archY, archW, archH, 12, "rgba(255, 143, 201, 0.09)", primaryMeta.color, 1.8);
  // Header tag
  drawRoundedRect(rightX + 46, archY + 14, 175, 22, 5, "rgba(255, 143, 201, 0.2)", primaryMeta.color, 1);
  ctx.fillStyle = primaryMeta.color;
  ctx.font = "bold 10px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.textAlign = "center";
  ctx.fillText("⬡ PRIMARY SPECIALIZATION", rightX + 46 + 175 / 2, archY + 29);

  // Score Badge
  drawRoundedRect(rightX + archW - 100, archY + 14, 88, 22, 5, "rgba(255, 255, 255, 0.08)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${result.radarScores.system}% LEADING`, rightX + archW - 56, archY + 29);

  // Line 1: Archetype Badge (e.g. ⚡ ARCHITECT)
  ctx.textAlign = "left";
  ctx.fillStyle = primaryMeta.color;
  ctx.font = "900 17px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText(primaryMeta.badge, rightX + 46, archY + 56);

  // Line 2: Role Title (e.g. System & Cloud Architect)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(primaryMeta.title, rightX + 46, archY + 75);

  // Line 3: Tagline
  ctx.fillStyle = "#b4d3f5";
  ctx.font = "italic 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(primaryMeta.tagline, rightX + 46, archY + 93);

  // Mini score progress bar
  drawRoundedRect(rightX + 46, archY + 107, archW - 80, 6, 3, "rgba(255,255,255,0.08)");
  drawRoundedRect(rightX + 46, archY + 107, (archW - 80) * (result.radarScores.system / 100), 6, 3, primaryMeta.color);

  // Secondary Support Archetype Card
  drawRoundedRect(rightX + 32 + archW + 12, archY, archW, archH, 12, "rgba(170, 102, 255, 0.09)", secondaryMeta.color, 1.8);
  const secX = rightX + 32 + archW + 12;

  drawRoundedRect(secX + 14, archY + 14, 175, 22, 5, "rgba(170, 102, 255, 0.2)", secondaryMeta.color, 1);
  ctx.fillStyle = secondaryMeta.color;
  ctx.font = "bold 10px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.textAlign = "center";
  ctx.fillText("⬢ CO-FACTOR SUPPORT", secX + 14 + 175 / 2, archY + 29);

  drawRoundedRect(secX + archW - 110, archY + 14, 98, 22, 5, "rgba(255, 255, 255, 0.08)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${result.radarScores.aiLogic}% CO-FACTOR`, secX + archW - 61, archY + 29);

  // Line 1: Archetype Badge (e.g. 🧠 LOGIC PIONEER)
  ctx.textAlign = "left";
  ctx.fillStyle = secondaryMeta.color;
  ctx.font = "900 17px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText(secondaryMeta.badge, secX + 14, archY + 56);

  // Line 2: Role Title (e.g. AI & Algorithmic Pioneer)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(secondaryMeta.title, secX + 14, archY + 75);

  // Line 3: Tagline
  ctx.fillStyle = "#b4d3f5";
  ctx.font = "italic 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(secondaryMeta.tagline, secX + 14, archY + 93);

  drawRoundedRect(secX + 14, archY + 107, archW - 80, 6, 3, "rgba(255,255,255,0.08)");
  drawRoundedRect(secX + 14, archY + 107, (archW - 80) * (result.radarScores.aiLogic / 100), 6, 3, secondaryMeta.color);

  // 3. Recommended Academic Track Banner (SOCS BINUS Bekasi)
  const recBannerY = archY + archH + 16;
  const recBannerH = 92;
  const recBannerGrad = ctx.createLinearGradient(rightX + 32, 0, rightX + rightW - 32, 0);
  recBannerGrad.addColorStop(0, "rgba(0, 255, 204, 0.12)");
  recBannerGrad.addColorStop(0.6, "rgba(0, 162, 255, 0.1)");
  recBannerGrad.addColorStop(1, "rgba(170, 102, 255, 0.08)");
  drawRoundedRect(rightX + 32, recBannerY, rightW - 64, recBannerH, 12, recBannerGrad, "#00ffcc", 1.8);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.8px";
  ctx.fillText("RECOMMENDED ACADEMIC TRACK • SOCS BINUS UNIVERSITY BEKASI", rightX + 48, recBannerY + 28);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(primaryMeta.socsTrack, rightX + 48, recBannerY + 60);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "600 12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Official Undergraduate Degree Program • School of Computer Science BINUS Bekasi", rightX + 48, recBannerY + 80);

  // Right-side badge stamp on track banner
  drawRoundedRect(rightX + rightW - 210, recBannerY + 20, 160, 52, 8, "rgba(0, 255, 204, 0.15)", "#00ffcc", 1);
  ctx.textAlign = "center";
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("BINUS BEKASI", rightX + rightW - 130, recBannerY + 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("SOCS ACCREDITED", rightX + rightW - 130, recBannerY + 58);

  // 4. Competency 4-Pillar Telemetry Grid
  const teleY = recBannerY + recBannerH + 16;
  ctx.textAlign = "left";
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.8px";
  ctx.fillText("COMPETENCY 4-PILLAR TELEMETRY GAUGES", rightX + 32, teleY + 14);

  const pillars = [
    { label: "System Architect", track: "Software Eng. & Enterprise", score: result.radarScores.system, color: "#ff8fc9" },
    { label: "AI & Logic", track: "Computational Science", score: result.radarScores.aiLogic, color: "#aa66ff" },
    { label: "Quality & Cyber", track: "Security & QA Testing", score: result.radarScores.debugging, color: "#00ffcc" },
    { label: "Interactive Tech", track: "Game Tech & Web Frontend", score: result.radarScores.creative, color: "#00ccff" },
  ];

  const barW = (rightW - 80) / 2;
  const barH = 62;

  pillars.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const px = rightX + 32 + col * (barW + 16);
    const py = teleY + 28 + row * (barH + 12);

    drawRoundedRect(px, py, barW, barH, 8, "rgba(255, 255, 255, 0.035)", "rgba(126, 249, 255, 0.15)", 1);

    // Label & Track
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(p.label, px + 16, py + 23);

    ctx.fillStyle = "#8baacb";
    ctx.font = "10.5px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(p.track, px + 16, py + 39);

    // Score Value
    ctx.textAlign = "right";
    ctx.fillStyle = p.color;
    ctx.font = "900 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${p.score}%`, px + barW - 16, py + 28);

    // Glowing Progress Track
    const miniTrackW = barW - 32;
    drawRoundedRect(px + 16, py + 46, miniTrackW, 6, 3, "rgba(255,255,255,0.07)");
    const miniFillW = Math.max(8, miniTrackW * (p.score / 100));
    drawRoundedRect(px + 16, py + 46, miniFillW, 6, 3, p.color);
  });

  // 5. Recommended Career Pathways Pills
  const careerY = teleY + 184;
  ctx.textAlign = "left";
  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.8px";
  ctx.fillText("RECOMMENDED CAREER PATHWAYS", rightX + 32, careerY + 14);

  const pillW = (rightW - 94) / 4;
  primaryMeta.careerPaths.forEach((career, idx) => {
    const cx = rightX + 32 + idx * (pillW + 10);
    const cy = careerY + 26;
    drawRoundedRect(cx, cy, pillW, 40, 7, "rgba(0, 204, 255, 0.07)", "rgba(0, 204, 255, 0.3)", 1);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
    const shortCareer = career.length > 22 ? career.slice(0, 20) + "..." : career;
    ctx.fillText(shortCareer, cx + pillW / 2, cy + 25);
  });

  // 6. Security Authentication Bar & Hologram Seal
  const authY = careerY + 78;
  drawRoundedRect(rightX + 32, authY, rightW - 64, 52, 9, "rgba(255, 215, 0, 0.06)", "rgba(255, 215, 0, 0.35)", 1.2);

  // Golden Commission Star Emblem
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★", rightX + 64, authY + 35);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("ACADEMIC COMMISSION SEAL • VERIFIED ON-DEVICE FLIGHT TELEMETRY", rightX + 94, authY + 24);

  ctx.fillStyle = "#9dbad6";
  ctx.font = "10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Official Gamified Specialization Dossier • School of Computer Science BINUS University Bekasi", rightX + 94, authY + 41);

  // 5. Card Bottom Security Strip
  ctx.strokeStyle = "rgba(126, 249, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(52, cardHeight - 50);
  ctx.lineTo(cardWidth - 52, cardHeight - 50);
  ctx.stroke();

  // Futuristic high-density barcode lines (bottom left)
  const barStartX = 52;
  const barY = cardHeight - 42;
  const barcodeH = 22;
  ctx.fillStyle = "rgba(0, 255, 204, 0.45)";
  for (let i = 0; i < 54; i++) {
    const w = i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
    ctx.fillRect(barStartX + i * 5, barY, w, barcodeH);
  }

  // Verification Hash & Signatures (bottom right)
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  ctx.textAlign = "right";
  ctx.fillStyle = "#698aa8";
  ctx.font = "10px 'Consolas', monospace";
  const docHash = `SA-SEC-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  ctx.fillText(
    `AUTH HASH: ${docHash}   •   ISSUED: ${dateFormatted.toUpperCase()}   •   BINUS UNIVERSITY BEKASI`,
    cardWidth - 52,
    cardHeight - 27
  );

  // 6. Convert Slide 1 Canvas & Render Slide 2 Canvas
  const slide1ImgData = canvas.toDataURL("image/png", 0.95);

  const canvas2 = document.createElement("canvas");
  renderSlide2(canvas2, cadet, result, signals);
  const slide2ImgData = canvas2.toDataURL("image/png", 0.95);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [cardWidth, cardHeight],
  });

  // Slide 1: Cadet Specialization Pass (Holographic Card)
  pdf.addImage(slide1ImgData, "PNG", 0, 0, cardWidth, cardHeight, undefined, "FAST");

  // Slide 2: Deep Personality & Stage Diagnostic Telemetry Report
  pdf.addPage([cardWidth, cardHeight], "landscape");
  pdf.addImage(slide2ImgData, "PNG", 0, 0, cardWidth, cardHeight, undefined, "FAST");

  const cleanName = (cadet.name || "Cadet").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `SpaceAcademy_CadetCard_${cleanName}.pdf`;

  pdf.save(fileName);
}

/**
 * Renders Slide 2: Deep Personality Analysis & Stage-by-Stage Diagnostic Evaluation
 */
function renderSlide2(
  canvas2: HTMLCanvasElement,
  cadet: CadetIdentity,
  result: SpecializationResult,
  signals?: TelemetrySignals
) {
  const cardWidth = 1600;
  const cardHeight = 1000;
  canvas2.width = cardWidth;
  canvas2.height = cardHeight;
  const ctx = canvas2.getContext("2d");
  if (!ctx) return;

  const profile = generateCadetPersonalityProfile(cadet, result, signals);
  const primaryMeta = ARCHETYPE_METAS[result.primaryArchetype];
  const secondaryMeta = ARCHETYPE_METAS[result.secondaryArchetype];

  const drawRoundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string | CanvasGradient | CanvasPattern,
    stroke?: string | CanvasGradient | CanvasPattern,
    strokeWidth = 1
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  const drawGlow = (cx: number, cy: number, r: number, color: string) => {
    const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rad.addColorStop(0, color);
    rad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 6
  ) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    let linesCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
        linesCount++;
        if (linesCount >= maxLines - 1 && i < words.length - 1) {
          let lastLine = line;
          for (let j = i + 1; j < words.length; j++) {
            const testLast = `${lastLine} ${words[j]}`;
            if (ctx.measureText(`${testLast}...`).width <= maxWidth) {
              lastLine = testLast;
            } else {
              break;
            }
          }
          ctx.fillText(`${lastLine}...`, x, currentY);
          return currentY + lineHeight;
        }
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  };

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
  bgGrad.addColorStop(0, "#030712");
  bgGrad.addColorStop(0.35, "#071329");
  bgGrad.addColorStop(0.7, "#0b1c3a");
  bgGrad.addColorStop(1, "#02050f");
  drawRoundedRect(0, 0, cardWidth, cardHeight, 26, bgGrad);

  // Coordinate Grid
  ctx.strokeStyle = "rgba(0, 255, 204, 0.035)";
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < cardWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cardHeight);
    ctx.stroke();
  }
  for (let y = 0; y < cardHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cardWidth, y);
    ctx.stroke();
  }

  // Ambient Nebulae
  drawGlow(300, 300, 450, "rgba(170, 102, 255, 0.09)");
  drawGlow(1200, 450, 500, "rgba(0, 255, 204, 0.09)");
  drawGlow(800, 800, 400, "rgba(0, 204, 255, 0.07)");

  // Dual Outer Cyber Borders
  ctx.strokeStyle = "rgba(126, 249, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, cardWidth - 40, cardHeight - 40);

  ctx.strokeStyle = "rgba(0, 255, 204, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, cardWidth - 60, cardHeight - 60);

  // Chamfer Brackets
  const cornerLength = 42;
  const drawBracket = (x: number, y: number, dx: number, dy: number) => {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * cornerLength, y);
    ctx.stroke();
  };
  drawBracket(20, 20, 1, 1);
  drawBracket(cardWidth - 20, 20, -1, 1);
  drawBracket(20, cardHeight - 20, 1, -1);
  drawBracket(cardWidth - 20, cardHeight - 20, -1, -1);

  // Holographic Header Foil Strip
  const foilGrad = ctx.createLinearGradient(48, 0, cardWidth - 48, 0);
  foilGrad.addColorStop(0, "rgba(170, 102, 255, 0.8)");
  foilGrad.addColorStop(0.3, "rgba(0, 255, 204, 0.9)");
  foilGrad.addColorStop(0.7, "rgba(0, 204, 255, 0.85)");
  foilGrad.addColorStop(1, "rgba(255, 143, 201, 0.8)");
  ctx.fillStyle = foilGrad;
  ctx.fillRect(48, 38, cardWidth - 96, 3);

  // Header Title
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("CADET FORENSIC TELEMETRY DOSSIER // STAGE DIAGNOSTIC REPORT", 52, 68);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SCHOOL OF COMPUTER SCIENCE (SOCS) • BINUS UNIVERSITY BEKASI   •   PAGE 02 OF 02", 52, 86);

  // Cadet Identity Pill (Top Right)
  const cadetPillX = cardWidth - 530;
  drawRoundedRect(cadetPillX, 48, 478, 42, 8, "rgba(6, 16, 38, 0.85)", "rgba(0, 255, 204, 0.4)", 1.2);
  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`CADET: ${cadet.name.toUpperCase()}  •  ID: #${cadet.name.substring(0, 3).toUpperCase()}-2026`, cadetPillX + 16, 66);
  ctx.fillStyle = "#a8cae6";
  ctx.font = "10px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`SCHOOL: ${cadet.school.toUpperCase()}  |  MAJOR: ${cadet.major.toUpperCase()}  |  CONFIDENCE: ${result.confidenceLevel}%`, cadetPillX + 16, 81);

  // Divider Line
  ctx.strokeStyle = "rgba(126, 249, 255, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(52, 106);
  ctx.lineTo(cardWidth - 52, 106);
  ctx.stroke();

  // TWO-COLUMN LAYOUT
  const leftX = 52;
  const leftW = 490;
  const rightX = 566;
  const rightW = cardWidth - rightX - 52; // 982
  const mainY = 120;
  const mainH = 816;

  // ─────────────────────────────────────────────────────────────
  // LEFT COLUMN: PSYCHOMETRIC & COGNITIVE SIGNATURE
  // ─────────────────────────────────────────────────────────────
  drawRoundedRect(leftX, mainY, leftW, mainH, 16, "rgba(6, 14, 32, 0.78)", "rgba(170, 102, 255, 0.35)", 1.5);

  // Card 1: Cognitive Signature Persona (H: 260)
  drawRoundedRect(leftX + 14, mainY + 14, leftW - 28, 250, 12, "rgba(12, 22, 48, 0.7)", "rgba(170, 102, 255, 0.4)", 1.2);
  ctx.fillStyle = "#aa66ff";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.textAlign = "left";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SECTION 01 // COGNITIVE SIGNATURE & PERSONA", leftX + 28, mainY + 36);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16.5px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText(profile.signatureTitle, leftX + 28, mainY + 62);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "italic 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(profile.signatureTagline, leftX + 28, mainY + 80);

  // Synergy Badges
  drawRoundedRect(leftX + 28, mainY + 92, 208, 28, 6, "rgba(255, 143, 201, 0.16)", "#ff8fc9", 1);
  ctx.fillStyle = "#ff8fc9";
  ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`★ ${primaryMeta.badge}`, leftX + 38, mainY + 110);

  drawRoundedRect(leftX + 246, mainY + 92, 210, 28, 6, "rgba(170, 102, 255, 0.16)", "#aa66ff", 1);
  ctx.fillStyle = "#aa66ff";
  ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`● ${secondaryMeta.badge}`, leftX + 256, mainY + 110);

  // Profile Narrative Text
  ctx.fillStyle = "#b8d5ed";
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  drawWrappedText(profile.cognitiveProfileSummary, leftX + 28, mainY + 142, leftW - 56, 17, 6);

  // Card 2: 4-Pillar Mastery Breakdown (H: 300)
  const pY = mainY + 276;
  drawRoundedRect(leftX + 14, pY, leftW - 28, 300, 12, "rgba(12, 22, 48, 0.7)", "rgba(0, 255, 204, 0.35)", 1.2);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SECTION 02 // 4-PILLAR PSYCHOMETRIC MASTERY", leftX + 28, pY + 24);

  profile.pillarDiagnostics.forEach((pillar, idx) => {
    const rowY = pY + 44 + idx * 62;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
    ctx.letterSpacing = "0.5px";
    ctx.fillText(pillar.name, leftX + 28, rowY);

    ctx.textAlign = "right";
    const levelColors: Record<string, string> = {
      Master: "#00ffcc",
      Advanced: "#7ef9ff",
      Proficient: "#aa66ff",
      Developing: "#ffaa00",
    };
    ctx.fillStyle = levelColors[pillar.level] || "#00ffcc";
    ctx.font = "bold 10.5px 'Consolas', monospace";
    ctx.fillText(`${pillar.score}% [${pillar.level.toUpperCase()}]`, leftX + leftW - 32, rowY);
    ctx.textAlign = "left";

    // Track
    const barW = leftW - 56;
    drawRoundedRect(leftX + 28, rowY + 6, barW, 9, 4, "rgba(20, 35, 60, 0.85)");

    // Fill
    const fillW = Math.max(10, Math.round((barW * pillar.score) / 100));
    const pGrad = ctx.createLinearGradient(leftX + 28, 0, leftX + 28 + fillW, 0);
    pGrad.addColorStop(0, "rgba(0, 255, 204, 0.8)");
    pGrad.addColorStop(1, levelColors[pillar.level] || "#00ffcc");
    drawRoundedRect(leftX + 28, rowY + 6, fillW, 9, 4, pGrad);

    // Descriptor
    ctx.fillStyle = "#8ea8c4";
    ctx.font = "9.5px 'Segoe UI', Arial, sans-serif";
    drawWrappedText(pillar.descriptor, leftX + 28, rowY + 28, barW, 13, 2);
  });

  // Card 3: Behavioral & Decision Dynamics (H: 212)
  const bY = mainY + 588;
  drawRoundedRect(leftX + 14, bY, leftW - 28, 212, 12, "rgba(12, 22, 48, 0.7)", "rgba(0, 204, 255, 0.35)", 1.2);

  ctx.fillStyle = "#00ccff";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SECTION 03 // BEHAVIORAL & DECISION DYNAMICS", leftX + 28, bY + 24);

  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("• Gaya Pengambilan Keputusan:", leftX + 28, bY + 48);
  ctx.fillStyle = "#d0e4f7";
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(profile.decisionMakingTrait, leftX + 42, bY + 66);

  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("• Kecepatan & Presisi Eksekusi:", leftX + 28, bY + 94);
  ctx.fillStyle = "#d0e4f7";
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(profile.efficiencyRating, leftX + 42, bY + 112);

  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("• Rekomendasi Adaptif:", leftX + 28, bY + 140);
  ctx.fillStyle = "#9dbad6";
  ctx.font = "10.5px 'Segoe UI', Arial, sans-serif";
  drawWrappedText(
    "Pertahankan fokus analitis saat menghadapi tantangan multi-variabel dan terus asah kolaborasi arsitektural di ekosistem SOCS BINUS.",
    leftX + 42,
    bY + 158,
    leftW - 74,
    15,
    3
  );

  // ─────────────────────────────────────────────────────────────
  // RIGHT COLUMN: STAGE-BY-STAGE FORENSIC TELEMETRY MATRIX
  // ─────────────────────────────────────────────────────────────
  drawRoundedRect(rightX, mainY, rightW, mainH, 16, "rgba(6, 14, 32, 0.78)", "rgba(0, 255, 204, 0.38)", 1.5);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 12px 'Consolas', monospace";
  ctx.letterSpacing = "2px";
  ctx.fillText("SECTION 04 // STAGE-BY-STAGE FORENSIC TELEMETRY EVALUATION (MISSIONS 01 - 06)", rightX + 20, mainY + 30);

  ctx.fillStyle = "#7ef9ff";
  ctx.font = "italic 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Audit kemampuan terperinci berdasarkan performa langsung kadet pada setiap sektor misi planet:", rightX + 20, mainY + 48);

  const colW = (rightW - 54) / 2; // ~464px
  const cardH = 114;
  const gridStartY = mainY + 62;

  profile.stageEvaluations.forEach((stage, i) => {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const sCardX = rightX + 18 + colIdx * (colW + 18);
    const sCardY = gridStartY + rowIdx * (cardH + 12);

    const isComplete = stage.completed;
    const borderCol = isComplete ? "rgba(0, 255, 204, 0.45)" : "rgba(255, 170, 0, 0.35)";
    const bgCol = isComplete ? "rgba(10, 24, 52, 0.75)" : "rgba(18, 20, 32, 0.65)";

    drawRoundedRect(sCardX, sCardY, colW, cardH, 10, bgCol, borderCol, 1.2);

    ctx.fillStyle = isComplete ? "#00ffcc" : "#ffaa00";
    ctx.font = "bold 11.5px 'Consolas', monospace";
    ctx.letterSpacing = "1px";
    ctx.fillText(`STAGE 0${stage.stageId}: ${stage.planetName.toUpperCase()} — ${stage.stageName}`, sCardX + 14, sCardY + 22);

    ctx.textAlign = "right";
    const gradeColor =
      stage.grade === "S"
        ? "#00ffcc"
        : stage.grade === "A+"
        ? "#7ef9ff"
        : stage.grade === "A"
        ? "#aa66ff"
        : "#ffaa00";
    drawRoundedRect(sCardX + colW - 134, sCardY + 9, 120, 20, 5, "rgba(0,0,0,0.4)", gradeColor, 1);
    ctx.fillStyle = gradeColor;
    ctx.font = "bold 9.5px 'Consolas', monospace";
    ctx.fillText(`[GRADE ${stage.grade}]`, sCardX + colW - 20, sCardY + 23);
    ctx.textAlign = "left";

    ctx.fillStyle = "#8ea8c4";
    ctx.font = "10px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`Kompetensi: ${stage.competencyArea}`, sCardX + 14, sCardY + 40);

    ctx.fillStyle = "#dcecf9";
    ctx.font = "10.5px 'Segoe UI', Arial, sans-serif";
    drawWrappedText(stage.evaluationText, sCardX + 14, sCardY + 58, colW - 28, 15, 3);

    drawRoundedRect(sCardX + 14, sCardY + cardH - 24, colW - 28, 18, 4, "rgba(0, 255, 204, 0.08)");
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 9.5px 'Consolas', monospace";
    ctx.fillText(`SCORE: ${stage.score} PTS   |   METRIC: ${stage.highlightMetric}`, sCardX + 22, sCardY + cardH - 11);
  });

  // Section 5: SOCS Program Matrix
  const acadY = gridStartY + 3 * (cardH + 12) + 8;
  const acadH = 176;
  drawRoundedRect(rightX + 18, acadY, rightW - 36, acadH, 12, "rgba(8, 20, 44, 0.85)", "rgba(170, 102, 255, 0.4)", 1.2);

  ctx.fillStyle = "#aa66ff";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SECTION 05 // RECOMMENDED ACADEMIC TRACK & CURRICULUM HORIZON", rightX + 32, acadY + 22);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText(profile.socsAcademicAlignment.recommendedProgram, rightX + 32, acadY + 46);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.fillText("SCHOOL OF COMPUTER SCIENCE (SOCS) • BINUS UNIVERSITY BEKASI", rightX + 32, acadY + 62);

  ctx.fillStyle = "#b8d5ed";
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  drawWrappedText(profile.socsAcademicAlignment.curriculumFocus, rightX + 32, acadY + 82, rightW - 64, 16, 2);

  ctx.fillStyle = "#7ef9ff";
  ctx.font = "bold 10px 'Consolas', monospace";
  ctx.fillText("KEY INDUSTRY ROLES:", rightX + 32, acadY + 128);

  const skills = profile.socsAcademicAlignment.keySkillsMatched;
  let pillStartX = rightX + 160;
  skills.forEach((skill) => {
    const pillW = ctx.measureText(skill).width + 24;
    drawRoundedRect(pillStartX, acadY + 114, pillW, 22, 6, "rgba(0, 204, 255, 0.15)", "#00ccff", 1);
    ctx.fillStyle = "#7ef9ff";
    ctx.font = "bold 10px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(skill, pillStartX + 12, acadY + 129);
    pillStartX += pillW + 10;
  });

  ctx.fillStyle = "#8ea8c4";
  ctx.font = "italic 10px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(profile.socsAcademicAlignment.industryOutlook, rightX + 32, acadY + 158);

  // Section 6: Digital Seal & Academic Authority
  const sealY = acadY + acadH + 10;
  const sealH = 152;
  drawRoundedRect(rightX + 18, sealY, rightW - 36, sealH, 12, "rgba(10, 26, 56, 0.8)", "rgba(255, 215, 0, 0.35)", 1.2);

  drawRoundedRect(rightX + 32, sealY + 14, 46, 46, 23, "rgba(255, 215, 0, 0.15)", "#ffd700", 2);
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★", rightX + 55, sealY + 44);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("ACADEMIC COMMISSION SEAL • VERIFIED STAGE FORENSIC TELEMETRY", rightX + 90, sealY + 32);

  ctx.fillStyle = "#9dbad6";
  ctx.font = "10.5px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Official Gamified Specialization Diagnostic Dossier • School of Computer Science (SOCS) BINUS University Bekasi", rightX + 90, sealY + 50);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  ctx.fillStyle = "#698aa8";
  ctx.font = "10px 'Consolas', monospace";
  const docHash = `SA-DIAG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  ctx.fillText(
    `AUTH TELEMETRY HASH: ${docHash}   •   ACCREDITED: ${dateFormatted.toUpperCase()}   •   BINUS UNIVERSITY BEKASI`,
    rightX + 32,
    sealY + 95
  );

  // Barcode strip
  ctx.fillStyle = "rgba(0, 255, 204, 0.45)";
  for (let i = 0; i < 90; i++) {
    const w = i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
    ctx.fillRect(rightX + 32 + i * 5, sealY + 112, w, 18);
  }
}

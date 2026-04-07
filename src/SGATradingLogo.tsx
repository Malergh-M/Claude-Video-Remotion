import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Canvas texture helpers
// ---------------------------------------------------------------------------

function makeSGATexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Dark background matching brand
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, W, H);

  // "SGA" text – heavy weight, tight tracking
  ctx.fillStyle = "#f5f5f5";
  ctx.font = `900 320px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SGA", W / 2, H / 2 + 10);

  return new THREE.CanvasTexture(canvas);
}

function makeTradingTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Brand red
  ctx.fillStyle = "#cc1b2e";
  ctx.fillRect(0, 0, W, H);

  // "TRADING" text
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 200px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TRADING", W / 2, H / 2);

  return new THREE.CanvasTexture(canvas);
}

function makeChromeTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 32;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#888888");
  grad.addColorStop(0.4, "#eeeeee");
  grad.addColorStop(0.6, "#ffffff");
  grad.addColorStop(1, "#666666");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  return new THREE.CanvasTexture(canvas);
}

// ---------------------------------------------------------------------------
// 3-D scene
// ---------------------------------------------------------------------------

const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sgaTex = useMemo(() => makeSGATexture(), []);
  const tradingTex = useMemo(() => makeTradingTexture(), []);
  const chromeTex = useMemo(() => makeChromeTexture(), []);

  // ---- Panel entry animations ----
  // SGA slides in from the left
  const sgaEntry = spring({ frame, fps, config: { damping: 68, mass: 0.75, stiffness: 100 } });
  const sgaX = interpolate(sgaEntry, [0, 1], [-9, 0]);
  const sgaZ = interpolate(sgaEntry, [0, 1], [-1.5, 0]);

  // TRADING slides in from the right (delayed by 12 frames)
  const tradEntry = spring({
    frame: frame - 12,
    fps,
    config: { damping: 68, mass: 0.75, stiffness: 100 },
  });
  const tradX = interpolate(tradEntry, [0, 1], [9, 0]);
  const tradZ = interpolate(tradEntry, [0, 1], [-1.5, 0]);

  // Divider: fades in once panels arrive (~frame 45)
  const dividerOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // ---- Logo group oscillation after assembly ----
  const oscillationStart = 55;
  const oscillationProgress = Math.max(0, frame - oscillationStart);
  const rotY = oscillationProgress * 0.012;           // slow continuous rotation
  const rotX = Math.sin(oscillationProgress * 0.04) * 0.04;

  // ---- Light sweep (sweeps L→R between frames 50-110) ----
  const sweepX = interpolate(frame, [50, 110], [-7, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  // Geometry dimensions (keep ratio from original logo)
  const SGA_W = 5.4;
  const SGA_H = 2.6;
  const TRAD_W = 5.4;
  const TRAD_H = 1.9;
  const DEPTH = 0.55;
  const GAP = 0.05;

  // Centre both panels on y=0: SGA top half, TRADING bottom half
  const logoHalfH = (SGA_H + TRAD_H + GAP) / 2;       // 2.275
  const sgaCY = logoHalfH - SGA_H / 2;                  //  0.975
  const tradCY = -logoHalfH + TRAD_H / 2;               // -1.325
  const dividerY = sgaCY - SGA_H / 2 - GAP / 2;         // -0.35 (sits in the gap)

  return (
    <>
      {/* ---- Lighting ---- */}
      <ambientLight intensity={0.35} />

      {/* Main key light – warm top-right */}
      <directionalLight position={[4, 7, 6]} intensity={2.2} />

      {/* Cool fill from left */}
      <directionalLight position={[-5, -2, 4]} intensity={0.5} color="#6699ff" />

      {/* Red accent from below (brand colour bleed) */}
      <pointLight position={[0, -5, 3]} intensity={1.8} color="#cc1b2e" />

      {/* Sweep light */}
      <pointLight position={[sweepX, 2, 4]} intensity={3.5} color="#ffffff" />

      {/* ---- Logo group ---- */}
      <group rotation={[rotX, rotY, 0]}>
        {/* SGA panel */}
        <mesh position={[sgaX, sgaCY, sgaZ]}>
          <boxGeometry args={[SGA_W, SGA_H, DEPTH]} />
          <meshStandardMaterial
            map={sgaTex}
            metalness={0.65}
            roughness={0.2}
            envMapIntensity={0.8}
          />
        </mesh>

        {/* TRADING panel */}
        <mesh position={[tradX, tradCY, tradZ]}>
          <boxGeometry args={[TRAD_W, TRAD_H, DEPTH]} />
          <meshStandardMaterial
            map={tradingTex}
            metalness={0.45}
            roughness={0.3}
            envMapIntensity={0.5}
          />
        </mesh>

        {/* Chrome divider strip – appears after both panels settle */}
        <mesh position={[0, dividerY, 0]} renderOrder={1}>
          <boxGeometry args={[SGA_W, GAP * 1.5, DEPTH + 0.02]} />
          <meshStandardMaterial
            map={chromeTex}
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={dividerOpacity}
          />
        </mesh>
      </group>
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------

export const SGATradingLogo: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Subtle camera pull-back at the very start, then settle
  const camZ = interpolate(
    spring({ frame, fps, config: { damping: 80, mass: 1.2 } }),
    [0, 1],
    [3.5, 6],
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #1e1e2e 0%, #0d0d0d 70%, #000000 100%)",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, camZ], fov: 58 }}
      >
        <LogoScene />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

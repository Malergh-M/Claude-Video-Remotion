import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const rotation = interpolate(frame, [0, durationInFrames], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile("sga-logo.png")}
        style={{
          width: 600,
          height: 200,
          objectFit: "contain",
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

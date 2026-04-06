import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f23",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: 72,
            fontFamily: "sans-serif",
            margin: 0,
          }}
        >
          Hello, Remotion!
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: 32,
            fontFamily: "sans-serif",
            marginTop: 16,
          }}
        >
          Frame {frame} / {durationInFrames}
        </p>
      </div>
    </AbsoluteFill>
  );
};

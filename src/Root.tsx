import React from "react";
import { Composition } from "remotion";
import { SGATradingLogo } from "./SGATradingLogo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SGATradingLogo"
      component={SGATradingLogo}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

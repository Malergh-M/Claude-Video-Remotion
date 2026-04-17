import React from "react";
import { Composition } from "remotion";
import { SGATradingLogo } from "./SGATradingLogo";
import {
  NvidiaStockChart,
  nvidiaStockSchema,
  NVIDIA_DEFAULT_PROPS,
} from "./NvidiaStockChart";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SGATradingLogo"
        component={SGATradingLogo}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NvidiaStockChart"
        component={NvidiaStockChart}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
        schema={nvidiaStockSchema}
        defaultProps={NVIDIA_DEFAULT_PROPS}
      />
    </>
  );
};

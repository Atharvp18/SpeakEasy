"use client";

import { gsap } from "gsap";
import React, { useEffect, useRef } from "react";

interface CrowdCanvasProps {
  src: string;
  rows?: number;
  cols?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const CrowdCanvas = ({ src, rows = 15, cols = 7 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = { src, rows, cols };

    const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
    const randomIndex = (array: any[]) => randomRange(0, array.length) | 0;
    const removeFromArray = (array: any[], i: number) => array.splice(i, 1)[0];
    const removeItemFromArray = (array: any[], item: any) =>
      removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = (array: any[]) => removeFromArray(array, randomIndex(array));
    const getRandomFromArray = (array: any[]) => array[randomIndex(array) | 0];

    const resetPeep = ({ stage, peep }: { stage: any; peep: any }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;
      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }
      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      return { startX, startY, endX };
    };

    const normalWalk = ({ peep, props }: { peep: any; props: any }) => {
      const { startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;
      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
      tl.to(
        peep,
        { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - 10 },
        0,
      );
      return tl;
    };

    const walks = [normalWalk];

    type Peep = {
      image: HTMLImageElement;
      rect: number[];
      width: number;
      height: number;
      x: number;
      y: number;
      anchorY: number;
      scaleX: number;
      walk: any;
      setRect: (rect: number[]) => void;
      render: (ctx: CanvasRenderingContext2D) => void;
    };

    const createPeep = ({ image, rect }: { image: HTMLImageElement; rect: number[] }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (r: number[]) => {
          peep.rect = r;
          peep.width = r[2] ?? 0;
          peep.height = r[3] ?? 0;
        },
        render: (c: CanvasRenderingContext2D) => {
          c.save();
          c.translate(peep.x, peep.y);
          c.scale(peep.scaleX, 1);
          c.drawImage(
            peep.image,
            peep.rect[0] ?? 0,
            peep.rect[1] ?? 0,
            peep.rect[2] ?? 0,
            peep.rect[3] ?? 0,
            0,
            0,
            peep.width,
            peep.height,
          );
          c.restore();
        },
      };
      peep.setRect(rect);
      return peep;
    };

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = config.rows * config.cols;
      const rectWidth = width / config.rows;
      const rectHeight = height / config.cols;
      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % config.rows) * rectWidth,
              ((i / config.rows) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          }),
        );
      }
    };

    const addPeepToCrowd = (): Peep => {
      const peep = removeRandomFromArray(availablePeeps);
      const walk = getRandomFromArray(walks)({
        peep,
        props: resetPeep({ peep, stage }),
      }).eventCallback("onComplete", () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });
      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const initCrowd = () => {
      while (availablePeeps.length) addPeepToCrowd().walk.progress(Math.random());
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    const render = () => {
      // Use the backing buffer's actual scale, not a DPR that may have changed
      // after moving the window between displays or changing browser zoom.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(canvas.width / stage.width, canvas.height / stage.height);
      crowd.forEach((peep) => peep.render(ctx));
      ctx.restore();
    };

    const resize = () => {
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      // Avoid oversized canvas buffers on high-resolution, high-DPI monitors.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, 8192 / Math.max(stage.width, stage.height));
      canvas.width = Math.round(stage.width * pixelRatio);
      canvas.height = Math.round(stage.height * pixelRatio);
      crowd.forEach((peep) => peep.walk.kill());
      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      initCrowd();
    };

    let started = false;
    img.onload = () => {
      started = true;
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };
    img.src = config.src;

    const handleResize = () => started && resize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      gsap.ticker.remove(render);
      crowd.forEach((peep) => peep.walk && peep.walk.kill());
    };
  }, [src, rows, cols]);

  return <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 h-[90vh] w-full" />;
};

export const PEEPS_SRC =
  "https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png";

const Skiper39 = () => (
  <div className="relative h-full w-full bg-background text-foreground">
    <div className="absolute bottom-0 h-full w-screen">
      <CrowdCanvas src={PEEPS_SRC} rows={15} cols={7} />
    </div>
  </div>
);

export { CrowdCanvas, Skiper39 };
export default Skiper39;

/**
 * Skiper 39 Canvas_Landing_004 — adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * Illustration by https://www.openpeeps.com/ — Attribution: Skiper UI (@gurvinder-singh02)
 */

declare module 'vanta/dist/vanta.net.min' {
  interface VantaNetEffect {
    destroy: () => void;
  }
  interface VantaNetOptions {
    el: HTMLElement;
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number;
    color?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
    backgroundAlpha?: number;
  }
  export default function NET(opts: VantaNetOptions): VantaNetEffect;
}

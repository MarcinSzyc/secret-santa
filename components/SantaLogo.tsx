// "Santa wrecking ball" from Tenor, served straight from Tenor's CDN (small animated WebP, ~43 KB):
// https://tenor.com/view/santa-wrecking-ball-gif-3014524362811767808
const SRC = "https://media.tenor.com/KdW977Qn_AAAAAA1/santa-wrecking-ball.webp";

export function SantaLogo({ size = 44 }: { size?: number }) {
  return (
    // A plain <img>: next/image would proxy and re-encode it, which drops the animation.
    <img src={SRC} width={size} height={size} alt="" className="santa-logo" style={{ borderRadius: Math.round(size / 4.5) }} />
  );
}

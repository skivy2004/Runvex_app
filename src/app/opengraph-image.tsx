import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview image for shared links (WhatsApp, LinkedIn, X, ...). Next.js turns this
// file into /opengraph-image and adds the og:image tags to every page.
export const alt = "Runvex: training that fits your shifts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = "Training that fits your shifts";
const SUBTITLE = "An AI coach that rebuilds your week when your schedule changes.";

export default async function OpengraphImage() {
  const mockup = await readFile(join(process.cwd(), "public/landing/app-mockup.jpg"));
  // The landing page's fonts (see components/landing/fonts.ts). The image generator
  // can't read .woff2, so these are TTF copies of the same files.
  const fonts = join(process.cwd(), "src/fonts");
  const [gambarino, switzer] = await Promise.all([
    readFile(join(fonts, "Gambarino-Regular.ttf")),
    readFile(join(fonts, "Switzer-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#262428", fontFamily: "Switzer" }}>
        {/* Left: logo, headline and subtitle. */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 620, padding: "0 48px 0 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 44, letterSpacing: "-0.05em", color: "#e7b0b0", fontFamily: "Gambarino" }}>
            <svg viewBox="262 160 494 676" width={34} height={46} fill="#f35e3e">
              <circle cx="651.75" cy="261.14" r="94.89" />
              <path d="M446.7,502.2l-114.35,18.74c-26.14,4.28-47.53-13.89-47.53-40.38h0c0-26.49,21.39-51.67,47.53-55.96l276.24-45.27c25.91-4.25,50.35,13.31,54.59,39.22,.13,.77,.23,1.54,.32,2.31h0s0,.04,0,.07v.11c2.8,25.56-5.77,51.06-23.43,69.74l-74.32,78.61c-13.9,14.71-12.53,38.09,3.01,51.06h0c8.59,7.18,20.1,9.83,30.96,7.13l27.49-6.83c14.95-3.71,30.69,1.63,40.29,13.67h0c7.39,9.27,10.22,21.39,7.68,32.97l-15.86,72.44c-4.53,20.69-11.97,40.63-22.1,59.22-10.08,18.49-28.07,31.77-48.98,34.25-27.62,3.28-53.71-11.67-65.11-36.4l-8.84-19.19c-5.34-11.59-18.85-16.92-30.66-12.11l-135.46,55.19c-19.28,7.85-41.39,3.39-56.11-11.33h0c-19.68-19.68-20.27-51.39-1.34-71.78l173.16-186.56c6.49-6.99,10.1-16.18,10.1-25.73h0c0-14.5-13-25.54-27.3-23.19Z" />
            </svg>
            <div style={{ display: "flex" }}>Runvex</div>
          </div>
          <div style={{ marginTop: 40, fontSize: 76, lineHeight: 0.98, letterSpacing: "-0.05em", color: "#f35e3e", fontFamily: "Gambarino" }}>{HEADLINE}</div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.3, letterSpacing: "-0.02em", color: "#e7b0b0" }}>{SUBTITLE}</div>
        </div>
        {/* Right: the app on a phone, cropped to the screen. A plain <img>, because
            ImageResponse draws an image and doesn't support next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={`data:image/jpeg;base64,${mockup.toString("base64")}`}
          width={580}
          height={630}
          style={{ objectFit: "cover", objectPosition: "47% 50%" }}
        />
      </div>
    ),
    { ...size, fonts: [
        { name: "Gambarino", data: gambarino, weight: 400, style: "normal" },
        { name: "Switzer", data: switzer, weight: 500, style: "normal" },
      ],
    },
  );
}

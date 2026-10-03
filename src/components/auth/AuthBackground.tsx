import Image from "next/image";
import background from "../../../public/auth-background.webp";

/**
 * The background behind login and register: a running photo in black and white
 * at low opacity, two soft color blobs (French Blue and Burnt Coral) drifting slowly,
 * and a fine grain on top. Decorative only.
 */
export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <Image
        src={background}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="object-cover opacity-20 grayscale"
      />
      <div className="auth-blob auth-blob-blue" />
      <div className="auth-blob auth-blob-coral" />
      {/* Fades everything into the dark background towards the bottom. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      <div className="auth-grain absolute inset-0" />
    </div>
  );
}

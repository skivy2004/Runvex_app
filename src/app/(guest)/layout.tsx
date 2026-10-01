import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

// Shared frame for the login and register pages.
export default function GuestLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between pt-4">
        <Logo className="text-lg" />
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </main>
  );
}

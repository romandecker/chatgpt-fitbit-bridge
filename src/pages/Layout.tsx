import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export function Layout({ children }: React.PropsWithChildren) {
  return (
    <div
      className={[
        geistSans.variable,
        geistMono.variable,
        "font-[family-name:var(--font-geist-sans)]",
        "p-5",
        "w-full",
        "flex",
        "justify-center",
      ].join(" ")}
    >
      <main className="w-full flex flex-col gap-2 items-center">
        {children}
      </main>
    </div>
  );
}

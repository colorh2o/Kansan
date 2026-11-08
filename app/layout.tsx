import type { Metadata } from "next";
import "./globals.css";
import "./kanban.css";

export const metadata: Metadata = {
  title: "Kansan | Team board",
  description: "A clear, shared space to keep your team's work moving.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata = {title:"RICK BRIDGE SERVER",description:"Private file bridge with REST and MCP."};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

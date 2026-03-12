import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
    subsets: ["latin", "cyrillic"],
    variable: "--font-montserrat",
    display: "swap",
});

export const metadata: Metadata = {
    title: "PROSTOR — водоочистка и обслуживание",
    description: "Монтаж и обслуживание систем водоочистки, продажа оборудования",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" data-theme="light">
            <body className={`${montserrat.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    );
}

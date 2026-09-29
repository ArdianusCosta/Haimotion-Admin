import { NextResponse } from "next/server";
import whois from "whois-json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Domain parameter is required" },
      { status: 400 }
    );
  }

  try {
    let options: Record<string, any> = { follow: 0 };
    if (domain.endsWith(".id")) {
      options.server = "whois.id";
    }
    const results = await whois(domain, options);
    return NextResponse.json(results);
  } catch (error) {
    console.error("WHOIS Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch WHOIS data. Pastikan format nama domain benar (contoh: haimotion.com)." },
      { status: 500 }
    );
  }
}

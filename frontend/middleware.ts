import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Phase 2 — collaborator will implement auth protection here
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

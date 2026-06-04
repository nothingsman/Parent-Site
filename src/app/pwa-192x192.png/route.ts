import { createParentPwaIcon } from "../pwa-icon";

export const runtime = "edge";

export async function GET() {
  return createParentPwaIcon({ size: 192 });
}

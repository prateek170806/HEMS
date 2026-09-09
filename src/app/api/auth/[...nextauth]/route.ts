import { handlers } from "../../../../../auth";
// Wait, tsconfig might map @/ to src/. auth.ts is at root. 
// Actually, it's safer to use relative from app/api/auth/[...nextauth]/route.ts -> ../../../../auth.ts

export const { GET, POST } = handlers;

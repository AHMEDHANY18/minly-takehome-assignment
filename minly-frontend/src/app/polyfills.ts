import { Buffer } from "buffer";

const g = globalThis as { global?: unknown; Buffer?: typeof Buffer; process?: unknown };

if (!g.global) g.global = globalThis;
if (!g.Buffer) g.Buffer = Buffer;
if (!g.process) g.process = { env: {} };

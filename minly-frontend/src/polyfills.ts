// src/polyfills.ts
import { Buffer } from "buffer";

const g = globalThis as any;

// amazon-cognito-identity-js / buffer expects global
if (!g.global) g.global = globalThis;

// بعض الحزم بتحتاج Buffer
if (!g.Buffer) g.Buffer = Buffer;

// أحياناً بيطلب process (احتياطي)
if (!g.process) g.process = { env: {} };

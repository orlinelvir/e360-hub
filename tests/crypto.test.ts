import { test } from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt, isEncrypted } from "../lib/crypto";

// lib/crypto.ts lee la variable al momento de cifrar/descifrar (no al cargar
// el módulo), así que fijarla aquí — antes de que corra cualquier test() —
// es suficiente para que la prueba no dependa de que .env.local esté cargado
// en este proceso.
process.env.ENCRYPTION_SECRET = "test-only-secret-never-use-in-prod";

test("encrypt/decrypt - round-trip preserva el texto original", () => {
  const original = "pit-abc123-token-de-ghl-del-broker";
  const encrypted = encrypt(original);
  assert.notEqual(encrypted, original);
  assert.equal(decrypt(encrypted), original);
});

test("decrypt - un ciphertext con el tag de autenticación alterado lanza error en vez de devolver basura", () => {
  const encrypted = encrypt("token-secreto-del-broker");
  const [iv, tag, data] = encrypted.split(":");
  // Cambia un solo carácter del tag — debe fallar la verificación GCM, no
  // devolver un string corrupto silenciosamente.
  const tamperedTag = (tag[0] === "0" ? "1" : "0") + tag.slice(1);
  const tampered = `${iv}:${tamperedTag}:${data}`;
  assert.throws(() => decrypt(tampered));
});

test("decrypt - un valor plano (sin ':') se devuelve tal cual, por compatibilidad con datos previos al cifrado", () => {
  assert.equal(decrypt("un-valor-sin-cifrar"), "un-valor-sin-cifrar");
});

test("isEncrypted - detecta el formato iv:tag:data y rechaza texto plano", () => {
  const encrypted = encrypt("cualquier-cosa");
  assert.equal(isEncrypted(encrypted), true);
  assert.equal(isEncrypted("texto-plano-normal"), false);
  assert.equal(isEncrypted(""), false);
});

test("encrypt/decrypt - un string vacío se devuelve tal cual en ambas direcciones", () => {
  assert.equal(encrypt(""), "");
  assert.equal(decrypt(""), "");
});

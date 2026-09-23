#!/usr/bin/env node
import { Client, Account, AppwriteException } from "appwrite";

const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = "6ab2e87100249e6b8ed9";

async function main() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  const account = new Account(client);

  console.log("→ Probando createEmailPasswordSession con credenciales inválidas…");
  try {
    await account.createEmailPasswordSession(
      "no-existe@siigo.local",
      "wrongPassword123",
    );
    console.log("✗ ERROR: el login no debería haber tenido éxito");
    process.exit(1);
  } catch (err) {
    if (err instanceof AppwriteException) {
      console.log(`✓ AppwriteException capturada correctamente`);
      console.log(`  code:    ${err.code}`);
      console.log(`  type:    ${err.type}`);
      console.log(`  message: ${err.message}`);
      if (err.code === 401 && err.type === "user_invalid_credentials") {
        console.log("✓ Auth funcionando: credenciales inválidas rechazadas con código esperado");
      } else {
        console.log("⚠ Código distinto al esperado, pero el SDK y el endpoint responden.");
      }
    } else {
      console.log("✗ Error inesperado:", err);
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});

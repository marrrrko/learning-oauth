import { runClientCredentialsTest } from "./client-credentials"

async function runEverything() {
    
  const auth0Config = {
    customDomain: process.env.CUSTOM_AUTH0_DOMAIN,
    domain: process.env.AUTH0_DOMAIN || "",
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
  }

  await runClientCredentialsTest(auth0Config)
}

runEverything()

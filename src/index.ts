import { runClientCredentialsTest } from "./client-credentials"
import { runPasswordGrantTest } from "./password[bad]"
import { createServer } from "node:http"
import { toNodeListener } from "h3"
import { app } from "./webapp"

const auth0Config = {
  customDomain: process.env.CUSTOM_AUTH0_DOMAIN,
  domain: process.env.AUTH0_DOMAIN || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
}

async function runEverything() {
  

  //await runClientCredentialsTest(auth0Config)
  await runPasswordGrantTest(
    auth0Config,
    "marcodelacarrer@protonmail.com",
    "dvHz9rDLqA7y3Rm"
  )
}

// try {
//   runEverything()
// } catch (err) {}

createServer(toNodeListener(app)).listen(process.env.PORT || 3222)

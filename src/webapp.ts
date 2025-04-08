import {
  createApp,
  createError,
  createRouter,
  defineEventHandler,
  getQuery,
  sendRedirect,
  useSession,
} from "h3"
import { nanoid } from "nanoid"
import crypto from "crypto"

export const app = createApp()
const SESSION_PASSWORD = "3HIiTjWFcvSG2T6F6vXCyFLuRrg3bIsPJOsT"

const auth0Config = {
  customDomain: process.env.CUSTOM_AUTH0_DOMAIN,
  domain: process.env.AUTH0_DOMAIN || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
}
const APP_URL = process.env.APP_URL
const router = createRouter()
app.use(router)

app.use(
  defineEventHandler(async (event) => {
    const session = await useSession(event, {
      name: "learn-app-session",
      password: SESSION_PASSWORD,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      },
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return session.data
  })
)

router.get(
  "/",
  defineEventHandler(async (event) => {
    const session = await useSession(event, {
      password: SESSION_PASSWORD,
    })
    return `<html>Hello world!<br /><br /><a href="/login">Login</a><br /><br />Session<pre>${JSON.stringify(
      session.data,
      null,
      "  "
    )}</pre></html>`
  })
)

router.get(
  "/count",
  defineEventHandler(async (event) => {
    const session = await useSession(event, {
      password: SESSION_PASSWORD,
    })

    const count = session.data.count || 0
    await session.update({ count: count + 1 })

    return `Count is ${count}`
  })
)

router.get(
  "/login",
  defineEventHandler(async (event) => {
    const session = await useSession(event, {
      password: SESSION_PASSWORD,
    })

    const state = nanoid(36)
    const code_verifier = nanoid(72)
    await session.update({ code_verifier, state })

    const code_challenge = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    //Code challenge will be base64 url encode string of the SHA256 hash of the code_verifier

    // See https://www.oauth.com/oauth2-servers/pkce/authorization-request/
    const queryStringParamsDict: Record<string, string> = {
      response_type: "code",
      client_id: auth0Config.clientId,
      redirect_uri: `${APP_URL}/oauth-finish`,
      state,
      code_challenge,
      code_challenge_method: "S256",
      scope: "openid profile email",
    }

    const queryStringParam = Object.keys(queryStringParamsDict).reduce(
      (acc, next) => {
        acc =
          acc +
          next +
          "=" +
          encodeURIComponent(queryStringParamsDict[next]) +
          "&"
        return acc
      },
      "?"
    )
    return sendRedirect(
      event,
      `https://${auth0Config.customDomain}/authorize` + queryStringParam
    )
  })
)

router.get(
  "/oauth-finish",
  defineEventHandler(async (event) => {
    const { code, state } = getQuery(event)

    const session = await useSession(event, {
      password: SESSION_PASSWORD,
    })

    if (!state || state !== session.data.state) {
      throw createError({ status: 401, message: "Invalid state" })
    }

    const bodyData = new URLSearchParams({
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      code_verifier: session.data.code_verifier,
      code: code as string,
      redirect_uri: `${APP_URL}/oauth-finish`,
      grant_type: "authorization_code",
    })

    console.log(bodyData.toString())

    const response = await fetch(
      `https://${auth0Config.customDomain}/oauth/token`,
      {
        method: "POST",
        body: bodyData,
      }
    )

    if (!response.ok) {
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json(),
      }
    }
    const { access_token, id_token } = await response.json()

    const [jwtHeader, jwtBody] = id_token
      .split(".")
      .slice(0, 2)
      .map((chunk: string) => {
        return JSON.parse(Buffer.from(chunk, "base64").toString("utf8"))
      })

    await session.update({
      user_id: jwtBody.sub,
      name: jwtBody.name,
      nickname: jwtBody.nickname,
      email: jwtBody.email,
      access_token,
      count: undefined,
      code_verifier: undefined,
      state: undefined,
    })

    return sendRedirect(event, "/")
  })
)

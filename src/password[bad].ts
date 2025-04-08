import { DateTime } from "luxon"

//Resource owner password grant
export async function runPasswordGrantTest(
  auth0Config: Auth0Config,
  username: string,
  password: string
) {
  console.log(
    `Attempting to obtain an access token using the following config:`
  )
  console.log(auth0Config)
  console.log(`${username} / *************`)

  const tokenEndpoint = `https://${auth0Config.customDomain}/oauth/token`

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      audience: `https://${auth0Config.domain}/api/v2/`,
      username,
      password,
      realm: 'Username-Password-Authentication'
    }),
  })

  const responseData = await response.json()
  if (response.ok) {
    console.log(responseData)
    const accessToken = responseData.access_token
  } else {
    //const responseBody = await response.text()
    throw new Error(
      `Failed to obtain token: ${response.status}\n${JSON.stringify(
        responseData,
        null,
        "  "
      )}`
    )
  }
}

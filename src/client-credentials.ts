import { DateTime } from 'luxon'
export async function runClientCredentialsTest(auth0Config: Auth0Config) {

  console.log(`Attempting to obtain an access token using the following config`)
  console.log(auth0Config)

  const tokenEndpoint = `https://${auth0Config.customDomain}/oauth/token`

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      audience: `https://${auth0Config.domain}/api/v2/`,
    }),
  })

  const responseData = await response.json()
  if (response.ok) {
    console.log(responseData)
    const accessToken = responseData.access_token
    const jwtParts = accessToken.split('.')
    const jwtBody = jwtParts[1]
    const decodedJwtBody = JSON.parse(Buffer.from(jwtBody, "base64").toString())
    console.log(decodedJwtBody)
    console.log(`Expires at ${DateTime.fromSeconds(decodedJwtBody.exp).toISO()}`)

  } else {
    const body = await response.text()
    throw new Error(
      `Failed to obtain token: ${response.status} ${responseData.error_description}`
    )
  }
}

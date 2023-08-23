import * as express from "express";
import * as OktaJwtVerifier from "@okta/jwt-verifier";
import * as cors from "cors";

interface RequestWithToken extends express.Request {
  jwt: OktaJwtVerifier.Jwt;
}
const app = express();
const port = 3001;

const yourOktaDomain = "dev-57384933.okta.com";
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `https://${yourOktaDomain}/oauth2/default`,
});
const audience = "api://default";
const authenticationRequired = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/Bearer (.+)/);
  if (!match) {
    return res.status(401).send("No authorization!");
  }

  try {
    const accessToken = match[1];
    if (!accessToken) {
      return res.status(401).send();
    }
    (req as RequestWithToken).jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, audience);
    return next();
  } catch (err) {
    return res.status(401).send((err as Error).message);
  }
};

app.get("/api/healthcheck", (_req, res) => {
  res.send("Hello world!");
});

app.get("/api/whoami", authenticationRequired, (req, res) => {
  res.json((req as RequestWithToken).jwt?.claims);
});

app.use(cors).listen(port, () => console.log("API Magic happening on port " + port));

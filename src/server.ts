import dotenv from "dotenv";
dotenv.config();
import App from "./app";
import logger from "./util/logger";

const app = new App();

const server = app.app.listen(process.env.PORT || 3000, () => {
  logger.info(`dg-api-gate listening on port ${process.env.PORT || 3000}`);
  logger.info(`dg-content-control url: ${process.env.dgContentControlUrl}`);
  logger.info(`jsontoword url: ${process.env.jsonToWordPostUrl}`);
});

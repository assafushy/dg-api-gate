import dotenv from "dotenv";
dotenv.config();
import App from "./app";
import logger from "./util/logger";

//dadding io to global object
declare global {
  namespace NodeJS {
    interface Global {
      io: any;
    }
  }
}

const app = new App();

const server = app.app.listen(process.env.PORT || 3000, () => {
  logger.info(`SysRs Server listening on port ${process.env.PORT || 3000}`);
  logger.info(`azure devops url : ${process.env.TFS_URI}`);
  logger.info(`azure devops token : ${process.env.TFS_PAT}`);
  logger.info(`minio url : ${process.env.MINIO_CLIENT_URL}`);
  logger.info(`jsontoword url: ${process.env.jsonToWordPostUrl}`);
  logger.info(`linux documents root dir url: ${process.env.DOCUMENTROOTDIR}`);
  logger.info(
    `windows documents root dir url: ${process.env.DOCUMENTROOTDIR_WINDOWS_PATH}`
  );
  logger.info(`dowload manager url: ${process.env.DOWNLOAD_MANAGER_URL}`);
  logger.info(`jaeger open-trace collector ip: ${process.env.JAEGER_ENDPOINT}`);
});

const io = require("socket.io")(server);

global.io = io;
io.on("connection", (socket) => {
  logger.info(`Client connected session : ${socket.id}`);
});

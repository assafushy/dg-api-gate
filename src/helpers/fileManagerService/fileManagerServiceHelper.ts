import axios from "axios";
import logger from "../../util/logger";
const moment = require("moment");
export class FileManagerServiceHelper {
  async perpareTemplateFile(
    url: string,
    ParentSpanHeaders: any
  ): Promise<string> {
    try {
      let headers = ParentSpanHeaders;
      logger.debug(url);
      let res = await axios.post(
        `${process.env.MINIO_CLIENT_URL}/minio/downloadFile/sharedDirectory`,
        {
          url,
          prefix: moment().format("DD-MM-YYYY-hh-mm"),
        },
        { headers }
      );
      return res.data.data.fullFilePath;
    } catch (err) {
      logger.error(err);
      throw new Error("Error downloading template");
    }
  } //createWordObject
  async uploadDocument(
    bucketName: string,
    fileName: string,
    filePath: string,
    ParentSpanHeaders: any
  ): Promise<string> {
    try {
      let headers = ParentSpanHeaders;
      logger.debug(`UploadingFile with : 
      bucketName: ${bucketName}
      fileName: ${fileName}
      filePath: ${filePath}
      `);
      let res = await axios.post(
        `${process.env.MINIO_CLIENT_URL}/minio/uploadFile`,
        {
          bucketName,
          fileName,
          filePath,
        },
        { headers }
      );
      return res.data;
    } catch (err) {
      logger.error(err.response.data);
    }
  } //createWordObject
  replaceWindowsAndLinuxPaths(path: string, toOS: string): string {
    logger.debug(`replacing payh with params: 
      path: ${path}
      toOS: ${toOS}`);
    switch (toOS) {
      case "windows":
        return path
          .replace(
            process.env.DOCUMENTROOTDIR,
            process.env.DOCUMENTROOTDIR_WINDOWS_PATH
          )
          .replace("/", "\\");
      case "linux":
        return path
          .replace(
            process.env.DOCUMENTROOTDIR_WINDOWS_PATH,
            process.env.DOCUMENTROOTDIR
          )
          .replace("\\", "/");
    }
  } //replaceWindowsAndLinuxPaths
}

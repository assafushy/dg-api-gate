import { Request, Response } from "express";
import { MinioRequest } from "models/MinioRequest";

import logger from "../util/logger";

var Minio = require("minio");

export class MinioController {
  public async getBucketFileList(req: Request, res: Response) {
    let jsonReq = JSON.stringify(req.params);
    let minioRequest: MinioRequest = JSON.parse(jsonReq);
    return new Promise((resolve, reject) => {
      const s3Client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ROOT_USER,
        secretKey: process.env.MINIO_ROOT_PASSWORD,
      });
      try {
        let objects = [];
        minioRequest.bucketName = minioRequest.bucketName.replace("_", "-");
        let stream = s3Client.listObjectsV2(minioRequest.bucketName);
        stream.on("data", (obj) => {
          objects.push(obj);
        });
        stream.on("end", (obj) => {
          resolve(objects);
        });
        stream.on("error", (obj) => {
          return [];
        });
        return objects;
      } catch (err) {
        logger.error(err);
        reject([]);
      }
    });
  }

  public async getJSONContentFromFile(req: Request, res: Response) {
    let jsonReq = JSON.stringify(req.params);
    let minioRequest: MinioRequest = JSON.parse(jsonReq);
    return new Promise((resolve, reject) => {
      const s3Client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ROOT_USER,
        secretKey: process.env.MINIO_ROOT_PASSWORD,
      });
      let miniData = "";
      s3Client.getObject(
        minioRequest.bucketName,
        minioRequest.fileName,
        function (err, dataStream) {
          if (err) {
            return logger.error(err);
          }
          dataStream.on("data", function (chunk) {
            miniData += chunk;
          });
          dataStream.on("end", function () {
            let cleaned = String(miniData).replace(/(\r\n|\n|\r)/gm, "");
            cleaned = String(cleaned).replace(/ /g, "");
            const json = JSON.parse(cleaned);
            return resolve(json);
          });
          dataStream.on("error", function (streamErr) {
            logger.error(streamErr);
            return reject(streamErr);
          });
        }
      );
    });
  }
  public async createBucketIfDoesentExsist(req: Request, res: Response) {
    let jsonReq = JSON.stringify(req.body);
    let minioRequest: MinioRequest = JSON.parse(jsonReq);
    const s3Client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    });
    try {
      s3Client.bucketExists(minioRequest.bucketName).then((exsistRes) => {
        if (exsistRes) {
          logger.info(`Bucket - ${minioRequest.bucketName} exsists.`);
        } else {
          let policy = {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicRead",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject", "s3:GetObjectVersion"],
                Resource: [`arn:aws:s3:::${minioRequest.bucketName}/*`],
              },
            ],
          };
          s3Client
            .makeBucket(minioRequest.bucketName, process.env.MINIO_REGION)
            .then(
              s3Client.setBucketPolicy(
                minioRequest.bucketName,
                JSON.stringify(policy)
              )
            );
          logger.info(
            `Bucket ${minioRequest.bucketName} created successfully in "${process.env.MINIO_REGION}".`
          );
        }
      });
    } catch (err) {
      logger.error(err);
    }
  }
}

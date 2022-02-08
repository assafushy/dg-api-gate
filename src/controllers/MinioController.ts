import { Request, Response } from "express";
import { MinioRequest } from "models/MinioRequest";

import logger from "../util/logger";

var Minio = require("minio");

export class MinioController {
  public async getBucketFileList(req: Request, res: Response) {
    return new Promise((resolve, reject) => {
      let jsonReq = JSON.stringify(req.params);
      let minioRequest: MinioRequest = JSON.parse(jsonReq);
      const s3Client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ROOT_USER,
        secretKey: process.env.MINIO_ROOT_PASSWORD,
      });
      try {
        let objects = [];
        this.standardizeRequest(minioRequest);
        let stream = s3Client.listObjectsV2(minioRequest.bucketName);
        stream.on("data", (obj) => {
          obj.key = `${process.env.MINIOSERVER}/${minioRequest.bucketName}/${obj.name}`;
          objects.push(obj);
        });
        stream.on("end", (obj) => {
          return resolve(objects);
        });
        stream.on("error", (obj) => {
          logger.error(obj);
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
    return new Promise((resolve, reject) => {
      let jsonReq = JSON.stringify(req.params);
      let minioRequest: MinioRequest = JSON.parse(jsonReq);
      const s3Client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ROOT_USER,
        secretKey: process.env.MINIO_ROOT_PASSWORD,
      });
      this.standardizeRequest(minioRequest);
        let miniData = "";
        s3Client.getObject(
          minioRequest.bucketName,
          minioRequest.fileName,
          (err, dataStream) => {
            if(err) {
              logger.error(err);
              return reject(`error due to ${err.code} - ${err.key}`);
            }
            dataStream.on("data", (chunk) => {
              miniData += chunk;
            });
            dataStream.on("end", () => {
              let cleaned = String(miniData).replace(/(\r\n|\n|\r)/gm, "");
              cleaned = String(cleaned).replace(/ /g, "");
              const json = JSON.parse(cleaned);
              return resolve(json);
            });
            dataStream.on("error", (streamErr) => {
              logger.error(streamErr);
              return reject(streamErr);
            });
          }
        );
    });
  }
  public async createBucketIfDoesentExsist(req: Request, res: Response) {
    return new Promise((resolve,reject) => {
    let jsonReq = JSON.stringify(req.body);
    let minioRequest: MinioRequest = JSON.parse(jsonReq);
    const s3Client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    });
    this.standardizeRequest(minioRequest);
      s3Client.bucketExists(minioRequest.bucketName).then((exsistRes) => {
        if (exsistRes) {
          logger.info(`Bucket - ${minioRequest.bucketName} exsists.`);
          return resolve(`Bucket - ${minioRequest.bucketName} exsists.`);
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
            .then(() =>
              s3Client.setBucketPolicy(
                minioRequest.bucketName,
                JSON.stringify(policy)
              )
            );
          logger.info(
            `Bucket ${minioRequest.bucketName} created successfully in "${process.env.MINIO_REGION}".`
          );
          return resolve(`Bucket ${minioRequest.bucketName} created successfully in ${process.env.MINIO_REGION}.`)
        }
      }).catch((err) =>{
        logger.error(err);
        return reject(err.message)
      });
  });
  }
  private standardizeRequest(minioRequest :MinioRequest){
    minioRequest.bucketName = minioRequest.bucketName.toLowerCase();
    minioRequest.bucketName = minioRequest.bucketName.replace("_", "-");
    minioRequest.bucketName = minioRequest.bucketName.replace(" " ,"");
  }
}

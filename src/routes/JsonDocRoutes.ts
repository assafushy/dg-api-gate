import { Request, Response } from "express";
import { DocumentsGeneratorController } from "../controllers/DocumentsGeneratorController";
import { MinioController } from "../controllers/MinioController";
import moment from "moment";

export class Routes {
  public documentsGeneratorController: DocumentsGeneratorController =
    new DocumentsGeneratorController();
  public minioController: MinioController = 
    new MinioController();

  public routes(app: any): void {
    app.route("/jsonDocument").get((req: Request, res: Response) => {
      res.status(200).json({ status: "online - " + moment().format() });
    });
    app.route("/jsonDocument/create").post(async (req: Request, res: Response) => {
      let documentUrl = await this.documentsGeneratorController.createJSONDoc(req, res);
      res.status(200).json({ documentUrl });
    });
    app.route("/minio/bucketFileList/:bucketName").get(async (req: Request, res: Response) => {
      let bucketFileList = await this.minioController.getBucketFileList(req, res);
      res.status(200).json({ bucketFileList })
    });
    app.route("/minio/contentFromFile/:bucketName/:fileName").get(async (req: Request, res: Response) => {
      let contentFromFile = await this.minioController.getJSONContentFromFile(req, res);
      res.status(200).json({ contentFromFile })
    });
    app.route("/minio/createBucket").post(async (req: Request, res: Response) => {
      await this.minioController.createBucketIfDoesentExsist(req, res);
      res.status(200).json({ })
    });
    }
}

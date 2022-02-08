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
      this.minioController.getBucketFileList(req, res).then((bucketFileList) => {
        res.status(200).json({ bucketFileList })
      });
    });
    app.route("/minio/contentFromFile/:bucketName/:fileName").get(async (req: Request, res: Response) => {
      this.minioController.getJSONContentFromFile(req, res).then((contentFromFile ) => {
        res.status(200).json({ contentFromFile  })
      }).catch((err ) => {
        res.status(404).json({ status:404,message:err })
      });
    });
    app.route("/minio/createBucket").post(async (req: Request, res: Response) => {
      this.minioController.createBucketIfDoesentExsist(req, res).then(( response )=> {
        res.status(200).json({ response })
      }).catch((err ) => {
        res.status(404).json({ status:404,message:err })
      });
    });
    }
}

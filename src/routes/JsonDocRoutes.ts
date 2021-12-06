import { Request, Response } from "express";
import { DocumentsGeneratorController } from "../controllers/DocumentsGeneratorController";
import moment from "moment";
import Axios from "axios";

export class Routes {
  public documentsGeneratorController: DocumentsGeneratorController =
    new DocumentsGeneratorController();

  public routes(app: any): void {
    app.route("/jsonDocument").get((req: Request, res: Response) => {
      res.status(200).json({ status: "online - " + moment().format() });
    });
    app.route("/jsonDocument/create").post(async (req: Request, res: Response) => {
      let documentUrl = this.documentsGeneratorController.createJSONDoc(req, res);
      res.status(200).json({ documentUrl });
    });
    app.route("/getDoc").post(async (req: Request, res: Response) => {
      let data = await this.documentsGeneratorController.getJSONDoc(req, res)
      res.status(200).json({ data });
    });
    }
}

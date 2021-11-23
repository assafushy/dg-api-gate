import { Request, Response } from "express";
import { DocumentsGeneratorController } from "../controllers/DocumentsGeneratorController";
import moment from "moment";

export class Routes {
  public documentsGeneratorController: DocumentsGeneratorController =
    new DocumentsGeneratorController();

  public routes(app: any): void {
    app.route("/jsonDocument").get((req: Request, res: Response) => {
      res.status(200).json({ status: "online - " + moment().format() });
    });

    app
      .route("/jsonDocument/create")
      .post(async (req: Request, res: Response) => {
        this.documentsGeneratorController.createJSONDoc(req, res);
        res.status(200).json({ status: "ok" });
      });
  }
}

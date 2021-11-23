import { Request, Response } from "express";
import { DocumentRequest } from "../models/DocumentRequest";
import { JSONDocumentGenerator } from "../helpers/JsonDocGenerators/JsonDocumentGenerator";
import axios from "axios";
import logger from "../util/logger";

export class DocumentsGeneratorController {
  public async createJSONDoc(req: Request, res: Response) {
    let json = JSON.stringify(req.body);
    let documentRequest: DocumentRequest = JSON.parse(json);

    let jsonDocumentGenerator: JSONDocumentGenerator =
      new JSONDocumentGenerator();
    try {
      //generate document template
      let docTemplate: any = axios.post(
        `${process.env.dgContentControlUrl}/generate-doc-template`,
        {
          orgUrl: documentRequest.tfsCollectionUri,
          token: documentRequest.PAT,
          projectName: documentRequest.teamProjectName,
          outputType: "json",
          templateUrl: documentRequest.templateFile,
        }
      );
      //generate content controls
      let contentControls = await jsonDocumentGenerator.generateContentControls(
        documentRequest
      );
      docTemplate.contentControls = contentControls;
      //generate word doc
      let documentUrl: any = await axios.post(
        `${process.env.jsonToWordPostUrl}`,
        docTemplate
      );
      return documentUrl;
    } catch (err) {
      logger.error(`Error running JsonToWord`);
    }
  }
}

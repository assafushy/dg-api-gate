import { Request, Response } from "express";
import { DocumentRequest } from "../models/DocumentRequest";
import { JSONDocumentGenerator } from "../helpers/JsonDocGenerators/JsonDocumentGenerator";
import axios from "axios";
import logger from "../util/logger";

export class DocumentsGeneratorController {
  public async createJSONDoc(req: Request, res: Response) {
    let json = JSON.stringify(req.body);
    let documentRequest: DocumentRequest = JSON.parse(json);
    if (!documentRequest.uploadProperties.AwsAccessKeyId) {
      documentRequest.uploadProperties.AwsAccessKeyId =
        process.env.MINIO_ROOT_USER;
    }
    if (!documentRequest.uploadProperties.AwsSecretAccessKey) {
      documentRequest.uploadProperties.AwsSecretAccessKey =
        process.env.MINIO_ROOT_PASSWORD;
    }
    if (!documentRequest.uploadProperties.Region) {
      documentRequest.uploadProperties.Region = process.env.MINIO_REGION;
    }
    if(!documentRequest.uploadProperties.ServiceUrl) {
      documentRequest.uploadProperties.ServiceUrl = process.env.MINIOSERVER;
    }
    documentRequest.uploadProperties.bucketName = documentRequest.uploadProperties.bucketName.toLowerCase();
    documentRequest.uploadProperties.bucketName = documentRequest.uploadProperties.bucketName.replace("_", "-");
    documentRequest.uploadProperties.bucketName = documentRequest.uploadProperties.bucketName.replace(" " ,"");
    let jsonDocumentGenerator: JSONDocumentGenerator =
      new JSONDocumentGenerator();
    try {
      //generate document template
      let docTemplateResponce: any = await axios.post(
        `${process.env.dgContentControlUrl}/generate-doc-template`,
        {
          orgUrl: documentRequest.tfsCollectionUri,
          token: documentRequest.PAT,
          projectName: documentRequest.teamProjectName,
          outputType: "json",
          templateUrl: documentRequest.templateFile,
        }
      );
      let docTemplate = docTemplateResponce.data;
      docTemplate.uploadProperties = documentRequest.uploadProperties;
      //generate content controls
      let contentControls = await jsonDocumentGenerator.generateContentControls(
        documentRequest
      );
      docTemplate.contentControls = contentControls;
      let documentUrl: any = await axios.post(
        `${process.env.jsonToWordPostUrl}/api/word/create`,
        docTemplate
      );
      return documentUrl.data;
    } catch (err) {
      logger.error(`Error running JsonToWord`);
    }
  }
}

import { Request, Response } from "express";
import { DocumentRequest } from "../models/DocumentRequest";
import { JSONDocumentGenerator } from "../helpers/JsonDocGenerators/JsonDocumentGenerator";
import { FileManagerServiceHelper } from "../helpers/fileManagerService/fileManagerServiceHelper";
import { eventEmmiter } from "../services/socketManager";
import { basename } from "path";
import { Tags, FORMAT_HTTP_HEADERS } from "opentracing";
import {
  tracedSubAction,
  finishSpanWithResult,
  tracer,
} from "../helpers/openTracing/tracer-middleware";
import logger from "../util/logger";

export class DocumentsGeneratorController {
  public async createJSONDoc(req: Request, res: Response) {
    let json = JSON.stringify(req.body);
    let jsonToWordResponse: string;
    let documentRequest: DocumentRequest = JSON.parse(json);
    let fileManagerServiceHelper = new FileManagerServiceHelper();
    let winFilePath;

    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req);
    const traceSpan = tracer.startSpan("/jsonDocument", {
      childOf: parentSpanContext,
      tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER },
    });
    traceSpan.log({ "request-body": JSON.stringify(req.body) });
    await eventEmmiter(global.io, "document-status", {
      documentId: req.body.documentId,
      status: "Parsing request",
    });

    const subTemplateSpan = tracedSubAction(
      traceSpan,
      "downloading-template-file"
    );
    try {
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Downloading template",
      });
      subTemplateSpan.log({ "template-file-url": req.body.templateFile });
      winFilePath = await fileManagerServiceHelper.perpareTemplateFile(
        req.body.templateFile,
        { "uber-trace-id": req["uber-trace-id"] }
      );
    } catch (err) {
      subTemplateSpan.finish();
      logger.error(`Error prepearing template`);
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Error prepearing template",
        message: err,
      });
    }

    try {
      documentRequest.templateFile =
        fileManagerServiceHelper.replaceWindowsAndLinuxPaths(
          winFilePath,
          "windows"
        );
      subTemplateSpan.log({
        "template-file-windows-path": req.body.templateFile,
      });
      logger.debug(`new file path: ${documentRequest.templateFile}`);
      subTemplateSpan.finish();
    } catch (err) {
      subTemplateSpan.finish();
      logger.error(`Error Converting file path to windows`);
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Error converting file ath to windows",
        message: err,
      });
    }
    const subSpanJsonGenerator = tracedSubAction(traceSpan, "generte-json-doc");
    try {
      subSpanJsonGenerator.log({
        "document-request": documentRequest,
      });
      let jsonDocumentGenerator: JSONDocumentGenerator =
        new JSONDocumentGenerator();
      jsonToWordResponse = await jsonDocumentGenerator.create(
        documentRequest,
        subSpanJsonGenerator
      );
      subSpanJsonGenerator.finish();
    } catch (err) {
      subSpanJsonGenerator.finish();
      finishSpanWithResult(traceSpan, 500, true);
      logger.error(`Error running JsonToWord`);
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Error running JsonToWord",
        message: err,
      });
    }
    const subSpanUploadDoc = tracedSubAction(
      traceSpan,
      "upload-document-to-minio"
    );

    try {
      subSpanUploadDoc.log({ "jsonToWord-file-response": jsonToWordResponse });
      let fileName = basename(jsonToWordResponse);
      jsonToWordResponse = fileManagerServiceHelper.replaceWindowsAndLinuxPaths(
        jsonToWordResponse,
        "linux"
      );
      let bucketName = req.body.teamProjectName.replace("_", "-");
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Uploading Document",
      });
      await fileManagerServiceHelper.uploadDocument(
        bucketName,
        fileName,
        jsonToWordResponse,
        { "uber-trace-id": req["uber-trace-id"] }
      );
      subSpanUploadDoc.log({
        "linux-file-path": jsonToWordResponse,
        bucketName: bucketName,
      });
      subSpanUploadDoc.finish();
      finishSpanWithResult(traceSpan, 200);
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Done",
      });
    } catch (err) {
      logger.error(`Error uploading document to minio`);
      subSpanUploadDoc.log({
        "linux-file-path": jsonToWordResponse,
      });
      subSpanUploadDoc.finish();
      finishSpanWithResult(traceSpan, 500, true);
      await eventEmmiter(global.io, "document-status", {
        documentId: req.body.documentId,
        status: "Error uploading document to minio",
        message: err,
      });
    }
  }
}

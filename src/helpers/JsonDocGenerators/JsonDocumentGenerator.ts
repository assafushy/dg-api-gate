import axios from "axios";
import { DocumentRequest } from "../../models/DocumentRequest";
import DGContentControls from "dg-content-control";
import { eventEmmiter } from "../../services/socketManager";
import { writeFileSync, mkdirSync } from "fs";
import moment from "moment";
import { Span } from "opentracing";

import { tracedSubAction } from "../openTracing/tracer-middleware";
import logger from "../../util/logger";

export class JSONDocumentGenerator {
  public async create(
    documentRequest: DocumentRequest,
    parentSpan?: Span
  ): Promise<string> {
    const subSpanCreateDoc = tracedSubAction(parentSpan, "creating-json-doc");
    let timeDate = moment().format("DD-MM-YYYY-hh-mm");
    try {
      let wordObject = await this.createWordObject(
        documentRequest,
        subSpanCreateDoc
      );
      subSpanCreateDoc.logEvent(
        `finished-generating-word-object`,
        JSON.stringify(wordObject)
      );
      try {
        if (process.platform === "win32") {
          mkdirSync(`c:\\json-docs\\${timeDate}`);
          writeFileSync(
            `c:\\json-docs\\${timeDate}\\json-document.json`,
            JSON.stringify(wordObject)
          );
        } else {
          mkdirSync(`/json-docs/${timeDate}`);
          writeFileSync(
            `/json-docs/${timeDate}/json-document.json`,
            JSON.stringify(wordObject)
          );
        }
      } catch (e) {
        subSpanCreateDoc.finish();
        console.warn(
          "failed to create document skeleton json file - this could happen when c:\\json-docs\\ or /json-docs/ is missing "
        );
      }
      subSpanCreateDoc.logEvent(`sending-object-to-jsonToWord`, {});
      let documentPath = await axios.post(
        process.env.jsonToWordPostUrl,
        wordObject
      );
      subSpanCreateDoc.finish();
      return documentPath.data.toString();
    } catch (error) {
      subSpanCreateDoc.finish();
      console.warn(
        `Error in json-to-word ${JSON.stringify(
          error.response.data
        )} - could be caused by big json data`
      );
      console.warn(
        `**************** trying file path route **********************`
      );
      try {
        console.warn(`trying to send request
        to:${process.env.jsonToWordPostUrl}-by-file
        jsonFilePath:C:\\docgen\\json-docs\\${timeDate}\\json-document.json`);
        let documentPath = await axios.post(
          `${process.env.jsonToWordPostUrl}-by-file`,
          {
            jsonFilePath: `C:\\docgen\\json-docs\\${timeDate}\\json-document.json`,
          }
        );
        return documentPath.data.toString();
      } catch (e) {
        logger.error(`error creating word document in jsonToWord`);
        logger.error(JSON.stringify(e));
      }
    }
  } //create

  public async createWordObject(
    documentRequest: DocumentRequest,
    span: Span
  ): Promise<{}> {
    span.log({
      TFS_URI: process.env.TFS_URI,
      TFS_PAT: process.env.TFS_PAT,
      teamproject: documentRequest.teamProjectName,
      templateFile: documentRequest.templateFile,
    });
    let dgContentControler = new DGContentControls(
      process.env.TFS_URI,
      process.env.TFS_PAT,
      documentRequest.teamProjectName,
      "json",
      documentRequest.templateFile
    );
    await dgContentControler.init();
    span.logEvent("dg-content-control initilized", "done");
    await Promise.all(
      documentRequest.contentControls.map(async (contentControl) => {
        await eventEmmiter(global.io, "document-status", {
          documentId: documentRequest.documentId,
          status: `Creating content control ${contentControl.title}`,
        });
        span.logEvent(
          `generating-content-control *** ${contentControl.title} ***`,
          JSON.stringify(contentControl)
        );
        try {
          if (contentControl.data.type === "query") {
            logger.info(
              `generating query content for: ${contentControl.title}`
            );
            await dgContentControler.addQueryBasedContent(
              contentControl.data.queryId,
              contentControl.title,
              contentControl.skin,
              1 * contentControl.headingLevel
            );
          }
          if (contentControl.skin === "test-std") {
            logger.info(
              `generating test description for: ${contentControl.title}`
            );
            await dgContentControler.addTestDescriptionContent(
              contentControl.data.planId,
              contentControl.data.testSuiteArray,
              contentControl.title,
              1 * contentControl.headingLevel,
              contentControl.data.includeAttachments
            );
          }
          if (contentControl.skin === "trace-table") {
            logger.info(`generating trace table for: ${contentControl.title}`);
            await dgContentControler.addTraceTableContent(
              contentControl.data.planId || null,
              contentControl.data.testSuiteArray || null,
              contentControl.data.queryId || null,
              contentControl.data.linkTypeFilterArray || [],
              contentControl.title,
              1 * contentControl.headingLevel
            );
          }
          if (contentControl.skin === "change-table") {
            logger.info(`generating change table for: ${contentControl.title}`);
            await dgContentControler.addChangeDescriptionTable(
              contentControl.data.repoId,
              contentControl.data.from,
              contentControl.data.to,
              contentControl.data.rangeType,
              contentControl.data.linkTypeFilterArray,
              contentControl.title,
              1 * contentControl.headingLevel
            );
          }
          span.logEvent(
            `finished-generating-content-control *** ${contentControl.title} ***`,
            JSON.stringify(contentControl)
          );
        } catch (err) {
          span.logEvent(
            `error-generating-content-control ${contentControl.title}`,
            JSON.stringify(contentControl)
          );
          console.error(`Error adding content control ${contentControl.title}`);
          console.error(err);
          await eventEmmiter(global.io, "document-status", {
            documentId: documentRequest.documentId,
            status: `Error adding content control ${contentControl.title}`,
            message: JSON.stringify(err),
          });
        }
      })
    );

    return dgContentControler.getDocument();
  } //createWordObject
}

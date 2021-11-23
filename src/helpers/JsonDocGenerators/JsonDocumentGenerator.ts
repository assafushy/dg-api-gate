import axios from "axios";
import { DocumentRequest } from "../../models/DocumentRequest";
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
    let timeDate = moment().format("DD-MM-YYYY-hh-mm");
    try {
      let wordObject = await this.createWordObject(documentRequest);
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
    await Promise.all(
      documentRequest.contentControls.map(async (contentControl) => {
        try {
          if (contentControl.data.type === "query") {
            logger.info(
              `generating query content for: ${contentControl.title}`
            );
            // await dgContentControler.addQueryBasedContent(
            //   contentControl.data.queryId,
            //   contentControl.title,
            //   contentControl.skin,
            //   1 * contentControl.headingLevel
            // );
          }
          if (contentControl.skin === "test-std") {
            logger.info(
              `generating test description for: ${contentControl.title}`
            );
            // await dgContentControler.addTestDescriptionContent(
            //   contentControl.data.planId,
            //   contentControl.data.testSuiteArray,
            //   contentControl.title,
            //   1 * contentControl.headingLevel,
            //   contentControl.data.includeAttachments
            // );
          }
          if (contentControl.skin === "trace-table") {
            logger.info(`generating trace table for: ${contentControl.title}`);
            // await dgContentControler.addTraceTableContent(
            //   contentControl.data.planId || null,
            //   contentControl.data.testSuiteArray || null,
            //   contentControl.data.queryId || null,
            //   contentControl.data.linkTypeFilterArray || [],
            //   contentControl.title,
            //   1 * contentControl.headingLevel
            // );
          }
          if (contentControl.skin === "change-table") {
            logger.info(`generating change table for: ${contentControl.title}`);
            // await dgContentControler.addChangeDescriptionTable(
            //   contentControl.data.repoId,
            //   contentControl.data.from,
            //   contentControl.data.to,
            //   contentControl.data.rangeType,
            //   contentControl.data.linkTypeFilterArray,
            //   contentControl.title,
            //   1 * contentControl.headingLevel
            // );
          }
        } catch (err) {
          console.error(`Error adding content control ${contentControl.title}`);
          console.error(err);
        }
      })
      );
      
      // return dgContentControler.getDocument();
      return {};
    } //createWordObject
}

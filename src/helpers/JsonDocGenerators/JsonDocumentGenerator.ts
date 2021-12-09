import axios from "axios";
import { DocumentRequest } from "../../models/DocumentRequest";
import logger from "../../util/logger";

export class JSONDocumentGenerator {
  public async generateContentControls(
    documentRequest: DocumentRequest
  ): Promise<any> {
    return Promise.all(
      documentRequest.contentControls.map(async (contentControl) => {
        logger.info(
          `generating ${contentControl.type} content for: ${contentControl.title}`
        );
        try {
          let contentControlResponse = await axios.post(
            `${process.env.dgContentControlUrl}/generate-content-control`,
            {
              orgUrl: documentRequest.tfsCollectionUri,
              token: documentRequest.PAT,
              projectName: documentRequest.teamProjectName,
              outputType: "json",
              templateUrl: documentRequest.templateFile,
              contentControlOptions: {
                title: contentControl.title,
                type: contentControl.type,
                headingLevel: contentControl.headingLevel,
                data: contentControl.data,
              },
            }
          );
          return contentControlResponse.data;
        } catch (err) {
          logger.error(`Error adding content control ${contentControl.title}`);
          logger.error(err);
        }
      })
    );
  }
}

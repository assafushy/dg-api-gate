export interface DocumentRequest {
  documentId?: string;
  templateFile: string;
  teamProjectName: string;
  tfsCollectionUri: string;
  contentControls: ContentControl[];
  vcrmQueryId: string;
  userEmail: string;
}

export interface ContentControl {
  title: string;
  skin: string;
  headingLevel: number;
  data: DataDescriptor;
}

export interface DataDescriptor {
  type: string;
  queryId?: string;
  repoId?: string;
  from?:string;//for range of sha,piplines,dates
  to?:string;//for range of sha,piplines,dates
  rangeType?:string[];
  planId?: number;
  testSuiteArray?: number[];
  linkTypeFilterArray?: string[];
  includeAttachments?: boolean;
}

export enum RequirementsTraceabilityMode {
  CustomerRequirementId,
  RequirementId,
}

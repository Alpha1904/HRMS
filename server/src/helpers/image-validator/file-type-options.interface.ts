import { MIME_TYPES } from "./mime-types.enum";

    
export interface IFileTypeOptions {
  acceptableTypes: MIME_TYPES | MIME_TYPES[];
}
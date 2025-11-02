import { IsArray, IsString } from "class-validator";

export class UpdateHRAdminSitesDto {
    @IsArray()
    @IsString({ each: true })
  sitesManaged?: string[];
}
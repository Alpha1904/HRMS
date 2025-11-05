import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class UpdateTeamDto {
  /**
   * An array of *Profile IDs* for the employees
   * to be added or removed from the team.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  employeeProfileIds: number[];
}
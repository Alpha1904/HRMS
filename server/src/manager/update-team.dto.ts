import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class UpdateTeamDto {
  @ApiProperty({
    description: 'An array of employee profile IDs to add or remove from the team.',
    example: [10, 11, 15],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  employeeProfileIds: number[];
}
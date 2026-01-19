import { ApiProperty } from '@nestjs/swagger';
import { ObjectiveStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateObjectiveStatusDto {
  @ApiProperty({ enum: ObjectiveStatus, example: ObjectiveStatus.IN_PROGRESS, description: 'New objective status' })
  @IsIn(Object.values(ObjectiveStatus))
  status: ObjectiveStatus;
}

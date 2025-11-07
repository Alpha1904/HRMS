import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  notificationIds: number[];
}
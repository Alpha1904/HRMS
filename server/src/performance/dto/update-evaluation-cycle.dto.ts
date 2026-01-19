import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationCycleDto } from './create-evaluation-cycle.dto';

export class UpdateEvaluationCycleDto extends PartialType(CreateEvaluationCycleDto) {}

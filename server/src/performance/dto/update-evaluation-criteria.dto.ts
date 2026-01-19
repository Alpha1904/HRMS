import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationCriteriaDto } from './create-evaluation-criteria.dto';

export class UpdateEvaluationCriteriaDto extends PartialType(CreateEvaluationCriteriaDto) {}

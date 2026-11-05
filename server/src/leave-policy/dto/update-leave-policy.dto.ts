import { PartialType } from '@nestjs/mapped-types';
import { CreateLeavePolicyDto } from './create-leave-policy.dto';

// Allows all fields in CreateLeavePolicyDto to be optional for an update
export class UpdateLeavePolicyDto extends PartialType(CreateLeavePolicyDto) {}
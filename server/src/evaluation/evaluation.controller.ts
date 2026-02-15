import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import {
  CreateEvaluationDto,
  CreateSelfEvaluationDto,
} from './dto/create-evaluation.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('evaluations')
@Controller('evaluations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  /**
   * POST /evaluations
   * Feature: Regular Assessments (Manager Action)
   */
  @ApiOperation({ summary: 'Create a manager-led evaluation' })
  @ApiResponse({
    status: 201,
    description: 'The evaluation has been successfully created.',
  })
  @Post()
  createManagerEvaluation(@Body() createEvaluationDto: CreateEvaluationDto) {
    // Note: selfEval is implicitly false here (manager review)
    return this.evaluationService.create(createEvaluationDto, false);
  }

  /**
   * POST /evaluations/self
   * Feature: Self-Evaluations (Employee Action)
   */
  @ApiOperation({ summary: 'Create a self-evaluation for an employee' })
  @ApiResponse({
    status: 201,
    description: 'The self-evaluation has been successfully created.',
  })
  @Post('self')
  createSelfEvaluation(@Body() createSelfEvaluationDto: CreateSelfEvaluationDto) {
    // Note: selfEval is explicitly true here (employee review)
    return this.evaluationService.create(createSelfEvaluationDto, true);
  }

  /**
   * GET /evaluations?profileId=...&evaluatorId=...
   * Retrieves all past evaluations (used by HR, employee, or manager)
   */
  @ApiOperation({ summary: 'Find all evaluations with optional filters' })
  @ApiQuery({
    name: 'profileId',
    required: false,
    type: Number,
    description: 'Filter evaluations by the employee profile ID.',
  })
  @ApiQuery({
    name: 'evaluatorId',
    required: false,
    type: Number,
    description: 'Filter evaluations by the evaluator (manager) profile ID.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'Filter evaluations by the evaluation period (e.g., QUARTERLY).',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of evaluations matching the criteria.',
  })
  @Get()
  findEvaluations(
    @Query('profileId', new ParseIntPipe({ optional: true })) profileId?: number,
    @Query('evaluatorId', new ParseIntPipe({ optional: true })) evaluatorId?: number,
    @Query('period') period?: string,
  ) {
    return this.evaluationService.findEvaluations(profileId, evaluatorId, period);
  }
}
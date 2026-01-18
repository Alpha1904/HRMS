import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@ApiTags('candidates')
@Controller('candidates')
export class CandidateController {
  constructor(private candidateService: CandidateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new candidate' })
  create(
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidateService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates with filters' })
  findAll(
    @Query() filters: any,
  ) {
    return this.candidateService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidateService.update(id, dto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get candidate documents' })
  findDocuments(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateService.findDocuments(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate candidate' })
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.candidateService.deactivate(id);
  }
}

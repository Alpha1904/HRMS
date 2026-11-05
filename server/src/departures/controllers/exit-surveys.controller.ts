import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { SubmitSurveyDto } from '../dto/submit-survey.dto';
import { ExitSurveysService } from '../services/exit-surveys.service';

@ApiTags('departures-exit-surveys')
@ApiBearerAuth()
@Controller('departures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExitSurveysController {
  constructor(private readonly service: ExitSurveysService) {}

  @Post(':id/survey')
  @Roles(Role.EMPLOYEE)
  @ApiOperation({ summary: 'Submit exit survey (employee only, own departure)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitSurveyDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    return this.service.submit(id, dto, user);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { DepartureAccessGuard } from '../guards/departure-access.guard';
import { UploadDepartureDocumentDto } from '../dto/upload-document.dto';
import { DepartureDocumentsService } from '../services/documents.service';

@ApiTags('departures-documents')
@ApiBearerAuth()
@Controller('departures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartureDocumentsController {
  constructor(private readonly service: DepartureDocumentsService) {}

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/departures',
        filename: (req, file, callback) => {
          const name = file.originalname.split('.')[0];
          const fileExtName = extname(file.originalname);
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${name}-${randomName}${fileExtName}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a departure document' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  async upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDepartureDocumentDto,
    @CurrentUser() user: CurrentUserInterface,
  ) {
    const serverUrl = 'http://localhost:3000';
    const url = `${serverUrl}/public/uploads/departures/${file.filename}`;
    return this.service.create(id, { name: dto.name, type: dto.type, url }, user);
  }

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartureAccessGuard)
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List departure documents' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  list(@Param('id', ParseIntPipe) id: number) {
    return this.service.list(id);
  }

  @Delete('documents/:documentId')
  @Roles(Role.MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete a departure document' })
  @ApiParam({ name: 'documentId', type: Number, example: 1 })
  remove(@Param('documentId', ParseIntPipe) documentId: number, @CurrentUser() user: CurrentUserInterface) {
    return this.service.remove(documentId, user);
  }
}

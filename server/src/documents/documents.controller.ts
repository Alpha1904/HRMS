import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}


  // get all docs 

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  async getAllDocuments() {
    return this.documentsService.docs();
  }

  @Post('upload')
  
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', enum: ['profile', 'candidate', 'application'] },
        entityId: { type: 'number' },
        type: { type: 'string' },
      },
    },
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.upload(
      file,
      dto.entityType,
      dto.entityId,
      dto.type,
    );
  }

  @Get(':id')
  
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document metadata by ID' })
  async getDocument(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findById(id);
  }

  @Delete(':id')
  
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    await this.documentsService.delete(id);
    return { message: 'Document deleted successfully' };
  }
}
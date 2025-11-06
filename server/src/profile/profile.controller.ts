import {
  Controller,
  Get,
  Body,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryProfileDto } from './dto/query-profile.dto';
import { FileTypePipe } from 'src/helpers/image-validator';
import { MIME_TYPES } from 'src/helpers/image-validator/mime-types.enum';

// @UseGuards(...) // TODO: Add Auth Guards
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findAll(@Query() query: QueryProfileDto) {
    return this.profileService.findAll(query);
  }

  // Get a profile by its *Profile ID*
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.findOne(id);
  }

  // A more useful endpoint: Get a profile by its *User ID*
  @Get('/user/:userId')
  findOneByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profileService.findOneByUserId(userId);
  }

  // Update a profile by its *Profile ID*
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(id, updateProfileDto);
  }

  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('file'
    , {
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/^image\/(png|jpeg|jpg)$/)) {
        callback(new Error('Only image files (png/jpeg/jpg) are allowed!'), false);
      }
      callback(null, true);
    }
  }
))
  updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 5MB file size limit
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // Only allow png or jpeg images
         new FileTypeValidator({ fileType: 'image/(png|jpeg)' })
        ],
      }),
    )

    file: Express.Multer.File,
  ) {
    return this.profileService.updateAvatar(id, file);
  }


  // Delete a profile by its *Profile ID*
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.remove(id);
  }
}
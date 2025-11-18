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
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryProfileDto } from './dto/query-profile.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

// @UseGuards(...) // TODO: Add Auth Guards
@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Find all profiles with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of profiles.'})
  findAll(@Query() query: QueryProfileDto) {
    return this.profileService.findAll(query);
  }

  // Get a profile by its *Profile ID*
  @Get(':id')
  @ApiOperation({ summary: 'Find a single profile by its ID' })
  @ApiResponse({ status: 200, description: 'Returns the profile.'})
  @ApiResponse({ status: 404, description: 'Profile not found.'})
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.findOne(id);
  }

  // A more useful endpoint: Get a profile by its *User ID*
  @Get('/user/:userId')
  @ApiOperation({ summary: 'Find a single profile by its associated User ID' })
  @ApiResponse({ status: 200, description: 'Returns the profile.'})
  @ApiResponse({ status: 404, description: 'Profile not found.'})
  findOneByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profileService.findOneByUserId(userId);
  }

  // Update a profile by its *Profile ID*
  @Patch(':id')
  @ApiOperation({ summary: 'Update a profile' })
  @ApiResponse({ status: 200, description: 'The profile has been successfully updated.'})
  @ApiResponse({ status: 404, description: 'Profile not found.'})
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(id, updateProfileDto);
  }

  @Patch(':id/avatar')
  @ApiOperation({ summary: 'Update a profile avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully.'})
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/avatars',
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
      fileFilter: (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    // Return an error if the file extension is not allowed
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
},
    }),
  )
  updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 5MB file size limit
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )

    file: Express.Multer.File,
  ) {
    return this.profileService.updateAvatar(id, file);
  }


  // Delete a profile by its *Profile ID*
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a profile' })
  @ApiResponse({ status: 200, description: 'The profile has been successfully soft-deleted.'})
  @ApiResponse({ status: 404, description: 'Profile not found.'})
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.remove(id);
  }
}
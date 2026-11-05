import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@ApiTags('Forums')
@Controller('forums')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // --- Forum/Category Endpoints ---
  
  @ApiOperation({ summary: 'Get all forums/categories' })
  @ApiResponse({ status: 200, description: 'List of all forums with topic counts' })
  @Get()
  findAllForums() {
    return this.forumService.findAllForums();
  }
  
  // --- Topic/Thread Endpoints ---

  @ApiOperation({ summary: 'Create a new forum topic/thread' })
  @ApiResponse({ status: 201, description: 'Topic successfully created', type: CreateTopicDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid forum/author' })
  @Post('topics')
  createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.forumService.createTopic(createTopicDto);
  }

  @ApiOperation({ summary: 'Get all topics in a specific forum' })
  @ApiParam({ name: 'forumId', description: 'The Forum ID' })
  @ApiResponse({ status: 200, description: 'List of topics ordered by pinned status and recency' })
  @Get(':forumId/topics')
  findTopicsInForum(@Param('forumId', ParseIntPipe) forumId: number) {
    return this.forumService.findTopicsInForum(forumId);
  }
  
  @ApiOperation({ summary: 'Get a specific topic with all its replies' })
  @ApiParam({ name: 'topicId', description: 'The Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic details with nested replies' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @Get('topics/:topicId')
  findOneTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.forumService.findOneTopic(topicId);
  }

  // --- Reply/Comment Endpoints ---

  @ApiOperation({ summary: 'Create a new reply to a topic' })
  @ApiResponse({ status: 201, description: 'Reply successfully created and parent topic updated', type: CreateReplyDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid topic/author' })
  @Post('replies')
  createReply(@Body() createReplyDto: CreateReplyDto) {
    return this.forumService.createReply(createReplyDto);
  }
}
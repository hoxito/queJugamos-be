import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateCommentDto } from "../games/dto/create-comment.dto";
import { CommentsService } from "./comments.service";

@ApiTags("comments")
@Controller("games/:slug/comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(@Param("slug") slug: string) {
    return this.commentsService.list(slug);
  }

  @Post()
  create(@Param("slug") slug: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(slug, dto);
  }
}

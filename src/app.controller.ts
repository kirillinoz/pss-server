import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('api/collection')
  getCollection() {
    return this.appService.getCollection();
  }

  @Get('api/video/:id')
  getVideo(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.appService.getVideo(id, req, res);
  }

  @Delete('api/video/:id')
  deleteVideo(@Param('id') id: string) {
    return this.appService.deleteVideo(id);
  }

  @Post('api/upload/title')
  uploadTitle(@Body() body: { title: string }) {
    return this.appService.uploadTitle(body.title);
  }

  @Post('api/upload/cover/:id')
  @UseInterceptors(FileInterceptor('cover'))
  uploadCover(
    @Param('id') id: string,
    @UploadedFile() cover: Express.Multer.File,
  ) {
    return this.appService.uploadCover(id, cover);
  }

  @Post('api/upload/video/:id')
  @UseInterceptors(FileInterceptor('video'))
  uploadMovie(
    @Param('id') id: string,
    @UploadedFile() video: Express.Multer.File,
  ) {
    return this.appService.uploadVideo(id, video);
  }
}

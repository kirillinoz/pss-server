import { Injectable } from '@nestjs/common';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  createReadStream,
  statSync,
  unlinkSync,
  rmSync,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

type UploadMessage = {
  id: string;
  progress: number;
  error: string | null;
};

type Movie = {
  id: string;
  title: string;
  cover: string;
};

@Injectable()
export class AppService {
  getCollection(): Movie[] {
    const titlesPath = 'storage/titles.json';
    const coversPath = 'storage/{id}/cover.jpg';

    if (!existsSync(titlesPath)) {
      return [];
    }

    // Read the existing titles and covers from the JSON files
    const collection = JSON.parse(readFileSync(titlesPath, 'utf8'));

    collection.map((movie: any) => {
      const coverPath = coversPath.replace('{id}', movie.id);
      if (existsSync(coverPath)) {
        const cover = readFileSync(coverPath, 'base64');
        movie.cover = cover;
      }
    });

    return collection;
  }

  getVideo(id: string, req: Request, res: Response) {
    const titlesPath = 'storage/titles.json';
    const videoPath = `storage/${id}/video.mp4`;

    // Read the existing titles and covers from the JSON files
    const collection = JSON.parse(readFileSync(titlesPath, 'utf8'));

    const title = collection.find((movie: any) => movie.id === id);

    if (!title) {
      return null;
    }

    if (existsSync(videoPath)) {
      const stat = statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
          res
            .status(416)
            .send(
              'Requested range not satisfiable\n' + start + ' >= ' + fileSize,
            );
          return;
        }

        const chunksize = end - start + 1;
        const file = createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        createReadStream(videoPath).pipe(res);
      }
      /*const videoStream = createReadStream(videoPath);
      videoStream.pipe(res);*/
    }
  }

  deleteVideo(id: string) {
    const titlesPath = 'storage/titles.json';
    const dir = `storage/${id}`;

    // Read the existing titles and covers from the JSON files
    const collection = JSON.parse(readFileSync(titlesPath, 'utf8'));

    const title = collection.find((movie: any) => movie.id === id);

    if (!title) {
      return null;
    }

    // Delete the directory
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true });
    }

    // Delete the title from the JSON file
    const updatedTitles = collection.filter((movie: any) => movie.id !== id);
    writeFileSync(titlesPath, JSON.stringify(updatedTitles));

    // Return any desired response
    return { id, progress: 100, error: null };
  }

  uploadTitle(title: string): UploadMessage {
    // Generate an ID
    const id = uuidv4();

    // Create an object with id and title
    const data = { id, title };

    // Read the existing titles from the JSON file
    const titlesPath = 'storage/titles.json';

    // Check if titlesPath exists, if not - create
    if (!existsSync(titlesPath)) {
      writeFileSync(titlesPath, '[]');
    }

    const existingTitles = JSON.parse(readFileSync(titlesPath, 'utf8'));

    // Add the new title to the existing titles
    existingTitles.push(data);

    // Write the updated titles back to the JSON file
    writeFileSync(titlesPath, JSON.stringify(existingTitles));

    // Return any desired response
    return { id, progress: 33, error: null };
  }

  uploadVideo(id: string, file: Express.Multer.File): UploadMessage {
    const videoPath = `storage/${id}/video.mp4`;

    // Save the movie file
    writeFileSync(videoPath, file.buffer.toString('base64'), 'base64');

    // Return any desired response
    return { id, progress: 66, error: null };
  }

  uploadCover(id: string, file: Express.Multer.File): UploadMessage {
    // Save the cover file
    const dir = `storage/${id}`;
    const coverPath = dir + '/cover.jpg';

    if (!existsSync(dir)) {
      mkdirSync(dir);
    }

    writeFileSync(coverPath, file.buffer.toString('base64'), 'base64');

    // Return any desired response
    return { id, progress: 100, error: null };
  }
}

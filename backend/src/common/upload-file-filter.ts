import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
]);

export function uploadFileFilter(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const extension = extname(file.originalname).toLowerCase();
  const isAllowedType = file.mimetype.startsWith('image/') || allowedMimeTypes.has(file.mimetype);

  if (allowedExtensions.has(extension) && isAllowedType) {
    callback(null, true);
    return;
  }

  callback(
    new BadRequestException('Only image, PDF, Word, Excel, and ZIP files are allowed.'),
    false,
  );
}

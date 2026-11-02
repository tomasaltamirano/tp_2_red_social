import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalImageValidationPipe implements PipeTransform {
  private readonly maxSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = /^image\/(jpg|jpeg|png|webp)$/;

  transform(file?: Express.Multer.File): Express.Multer.File | undefined {
    if (!file) {
      return undefined;
    }

    if (!this.allowedMimeTypes.test(file.mimetype)) {
      throw new BadRequestException(
        'Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP',
      );
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('La imagen no puede superar los 5MB');
    }

    return file;
  }
}

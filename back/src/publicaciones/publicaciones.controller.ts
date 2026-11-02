import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { GetPublicacionesQueryDto } from './dto/get-publicaciones-query.dto.js';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { OptionalImageValidationPipe } from './pipes/optional-image-validation.pipe.js';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listar(@Query() query: GetPublicacionesQueryDto) {
    return this.publicacionesService.listar(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Body() createDto: CreatePublicacionDto,
    @UploadedFile(OptionalImageValidationPipe)
    file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.publicacionesService.crear(createDto, user, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  eliminar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publicacionesService.bajaLogica(id, user);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  darMeGusta(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publicacionesService.darMeGusta(id, user);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  quitarMeGusta(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publicacionesService.quitarMeGusta(id, user);
  }
}

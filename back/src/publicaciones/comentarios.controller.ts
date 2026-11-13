import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';
import { GetComentariosQueryDto } from './dto/get-comentarios-query.dto.js';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('publicaciones/:publicacionId/comentarios')
export class ComentariosController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listarComentarios(
    @Param('publicacionId') publicacionId: string,
    @Query() query: GetComentariosQueryDto,
  ) {
    return this.publicacionesService.obtenerComentarios(publicacionId, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  agregarComentario(
    @Param('publicacionId') publicacionId: string,
    @Body() dto: CreateComentarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.publicacionesService.agregarComentario(
      publicacionId,
      dto,
      user,
    );
  }

  @Put(':comentarioId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  editarComentario(
    @Param('publicacionId') publicacionId: string,
    @Param('comentarioId') comentarioId: string,
    @Body() dto: UpdateComentarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.publicacionesService.modificarComentario(
      publicacionId,
      comentarioId,
      dto,
      user,
    );
  }
}

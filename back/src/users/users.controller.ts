import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsNotEmpty } from 'class-validator';
import { UsersService } from './users.service.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ImageValidationPipe } from '../auth/pipes/image-validation.pipe.js';

export class CreateUserAdminDto extends RegisterDto {
  @IsNotEmpty()
  @IsIn(['usuario', 'administrador'])
  perfil: 'usuario' | 'administrador';
}

@Controller('usuarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar() {
    return this.usersService.listar();
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Body() dto: CreateUserAdminDto,
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
  ) {
    return this.usersService.crearComoAdmin(dto, file);
  }

  @Delete(':id')
  deshabilitar(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
    return this.usersService.cambiarEstado(id, false, admin.sub);
  }

  @Post(':id/habilitar')
  habilitar(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
    return this.usersService.cambiarEstado(id, true, admin.sub);
  }
}

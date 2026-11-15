import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  descripcion?: string;
}

@Controller('usuarios')
@UseGuards(JwtAuthGuard) // Protege todas las rutas con JWT
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Cualquier usuario logueado puede editar su propio perfil
  @Put('perfil')
  @UseInterceptors(FileInterceptor('imagen'))
  actualizarMiPerfil(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.actualizarPerfil(user.sub, dto, file);
  }

  // Rutas exclusivas de Administrador
  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.usersService.listar();
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('imagen'))
  crear(
    @Body() dto: CreateUserAdminDto,
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
  ) {
    return this.usersService.crearComoAdmin(dto, file);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deshabilitar(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
    return this.usersService.cambiarEstado(id, false, admin.sub);
  }

  @Post(':id/habilitar')
  @UseGuards(AdminGuard)
  habilitar(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
    return this.usersService.cambiarEstado(id, true, admin.sub);
  }
}

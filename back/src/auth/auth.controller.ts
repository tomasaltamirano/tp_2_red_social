import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ImageValidationPipe } from './pipes/image-validation.pipe.js';
import { JwtAuthGuard, JwtPayload } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imagen'))
  registro(
    @Body() registerDto: RegisterDto,
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, file, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  autorizar(@CurrentUser() user: JwtPayload) {
    return this.authService.autorizar(user);
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  refrescar(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(user, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}

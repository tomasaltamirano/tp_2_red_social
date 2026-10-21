import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Usuario o correo es obligatorio' })
  @IsString()
  identifier: string; // puede ser correo o nombreUsuario

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  password: string;
}

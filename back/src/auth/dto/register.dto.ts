import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsDateString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  apellido: string;

  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @IsString()
  nombreUsuario: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula y un número',
  })
  password: string;

  @IsNotEmpty({ message: 'Debés repetir la contraseña' })
  @IsString()
  repetirPassword: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagenPerfil?: string; // por ahora string

  @IsOptional()
  @IsIn(['usuario', 'administrador'])
  perfil?: string;
}

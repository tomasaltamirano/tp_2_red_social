import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePublicacionDto {
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @IsString()
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres' })
  titulo: string;

  @IsNotEmpty({ message: 'La descripción/mensaje es obligatoria' })
  @IsString()
  @MaxLength(1500, {
    message: 'La descripción no puede superar los 1500 caracteres',
  })
  descripcion: string;

  @IsOptional()
  @IsString()
  notas?: string; // Puede enviarse separado por comas en el FormData, ej: "Bergamota,Cedro,Ámbar"
}

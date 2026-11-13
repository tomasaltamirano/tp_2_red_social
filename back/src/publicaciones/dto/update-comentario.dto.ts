import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateComentarioDto {
  @IsNotEmpty({ message: 'El mensaje del comentario no puede estar vacío' })
  @IsString()
  @MaxLength(500, {
    message: 'El comentario no puede superar los 500 caracteres',
  })
  mensaje: string;
}

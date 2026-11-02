import { IsIn, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPublicacionesQueryDto {
  @IsOptional()
  @IsIn(['fecha', 'likes'], {
    message: 'El ordenamiento debe ser "fecha" o "likes"',
  })
  sortBy?: 'fecha' | 'likes' = 'fecha';

  @IsOptional()
  @IsMongoId({ message: 'El ID de usuario para filtrar no es válido' })
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

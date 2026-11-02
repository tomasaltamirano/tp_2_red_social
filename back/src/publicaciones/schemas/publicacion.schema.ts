import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export type PublicacionDocument = Publicacion & Document;

@Schema({ timestamps: true })
export class ComentarioSubschema {
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, trim: true })
  mensaje: string;

  @Prop({ default: false })
  modificado: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ComentarioSchema =
  SchemaFactory.createForClass(ComentarioSubschema);

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true, trim: true })
  descripcion: string;

  @Prop({ default: '' })
  imagenUrl: string;

  @Prop({ type: [String], default: [] })
  notas: string[]; // Opcional para mantener tus tags de acordes olfativos en Profumi

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  usuario: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ type: [ComentarioSchema], default: [] })
  comentarios: ComentarioSubschema[];

  @Prop({ default: true })
  activo: boolean; // Baja lógica
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

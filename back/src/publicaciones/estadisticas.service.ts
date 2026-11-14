import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Publicacion,
  PublicacionDocument,
} from './schemas/publicacion.schema.js';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly pubModel: Model<PublicacionDocument>,
  ) {}

  private parsearRango(desde?: string, hasta?: string) {
    const fin = hasta ? new Date(`${hasta}T23:59:59.999-03:00`) : new Date();
    const inicio = desde
      ? new Date(`${desde}T00:00:00.000-03:00`)
      : new Date(fin.getTime() - 30 * 86_400_000);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    return { inicio, fin };
  }

  // Gráfico 1: Publicaciones por usuario
  async publicacionesPorUsuario(desde?: string, hasta?: string) {
    const { inicio, fin } = this.parsearRango(desde, hasta);

    return this.pubModel.aggregate([
      { $match: { activo: true, createdAt: { $gte: inicio, $lte: fin } } },
      { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: '$u' },
      {
        $project: {
          _id: 0,
          label: { $concat: ['@', '$u.nombreUsuario'] },
          cantidad: 1,
        },
      },
    ]);
  }

  // Gráfico 2: Comentarios por día en el tiempo
  async comentariosPorDia(desde?: string, hasta?: string) {
    const { inicio, fin } = this.parsearRango(desde, hasta);

    return this.pubModel.aggregate([
      { $match: { activo: true } },
      { $unwind: '$comentarios' },
      { $match: { 'comentarios.createdAt': { $gte: inicio, $lte: fin } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$comentarios.createdAt',
              timezone: 'America/Argentina/Buenos_Aires',
            },
          },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', cantidad: 1 } },
    ]);
  }

  // Gráfico 3: Comentarios por publicación
  async comentariosPorPublicacion(desde?: string, hasta?: string) {
    const { inicio, fin } = this.parsearRango(desde, hasta);

    return this.pubModel.aggregate([
      { $match: { activo: true } },
      { $unwind: '$comentarios' },
      { $match: { 'comentarios.createdAt': { $gte: inicio, $lte: fin } } },
      {
        $group: {
          _id: '$_id',
          label: { $first: '$titulo' },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { cantidad: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, label: 1, cantidad: 1 } },
    ]);
  }
}

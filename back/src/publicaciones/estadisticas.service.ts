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
  // Gráfico 2: Comentarios por día en el tiempo (rellenando días sin actividad con 0)
  async comentariosPorDia(desde?: string, hasta?: string) {
    const { inicio, fin } = this.parsearRango(desde, hasta);

    const filas = await this.pubModel.aggregate<{
      _id: string;
      cantidad: number;
    }>([
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
    ]);

    const mapaPorDia = new Map(filas.map((f) => [f._id, f.cantidad]));
    const resultado: { label: string; cantidad: number }[] = [];

    // Recorremos día por día desde inicio hasta fin en hora Argentina
    const cursor = new Date(inicio);
    while (cursor <= fin) {
      const diaStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(cursor);

      resultado.push({
        label: diaStr.slice(5).split('-').reverse().join('/'), // Formato "14/11" más limpio en el eje X
        cantidad: mapaPorDia.get(diaStr) ?? 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return resultado;
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

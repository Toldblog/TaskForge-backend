import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { APIService } from './api.service';

@Injectable()
export class CRUDService {
  constructor(
    private prismaService: PrismaService,
    private apiService: APIService
    ) {}

  async getAll(model: string, options: any): Promise<any> {
    const prismaModel = this.apiService.getModel(model);
    const filter = this.apiService.getFilterObj(options);
    const sortBy = this.apiService.getSortObj(options);
    const selectedFields = this.apiService.getSelectedFields(options);
    // console.log(sortBy)

    const doc = await this.prismaService[prismaModel].findMany({
      where: filter,
      orderBy: sortBy,
      select: selectedFields,
    });

    return {
      status: 'success',
      results: doc.length,
      data: {
        data: { [model]: doc },
      },
    };
  }

  async getOne(model: string, id: string): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!doc) {
      throw new NotFoundException(`No document found with ID: ${id}`);
    }

    return {
      status: 'success',
      data: {
        data: { [model]: doc },
      },
    };
  }

  async createOne(model: string, body: any): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].create({
      data: body,
    });

    return {
      status: 'success',
      data: {
        data: { [model]: doc },
      },
    };
  }

  async updateOne(model: string, id: string, body: any): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].update({
      where: { id: parseInt(id, 10) },
      data: body,
    });

    if (!doc) {
      throw new NotFoundException(`No document found with ID: ${id}`);
    }

    return {
      status: 'success',
      data: {
        data: { [model]: doc },
      },
    };
  }

  async deleteOne(model: string, id: string): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].delete({
      where: { id: parseInt(id, 10) },
    });

    if (!doc) {
      throw new NotFoundException(`No document found with ID: ${id}`);
    }

    return {
      status: 'success',
      data: null,
    };
  }
}

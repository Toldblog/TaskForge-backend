import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { APIService } from './api.service';
import { UtilService } from './util.service';

@Injectable()
export class CRUDService {
  constructor(
    private prismaService: PrismaService,
    private apiService: APIService,
    private utilService: UtilService,
  ) { }

  async getAll(model: string, options: any): Promise<any> {
    const prismaModel = this.apiService.getModel(model);
    let doc = null;

    if (Object.keys(options).length > 0) {
      const filter = this.apiService.getFilterObj(options);
      const sortBy = this.apiService.getSortObj(options);
      const selectedFields = this.apiService.getSelectedFields(options);
      const { skip, take } = this.apiService.getPagination(options);

      doc = await this.prismaService[prismaModel].findMany({
        where: filter,
        orderBy: sortBy,
        select: selectedFields,
        skip,
        take
      });
    } else {
      doc = await this.prismaService[prismaModel].findMany({});
    }

    return {
      results: doc.length,
      [model + 's']: doc.map((item) => this.utilService.filterResponse(item))
    };
  }

  async getOne(model: string, id: string, include: object = null): Promise<any> {
    const prismaModel = this.apiService.getModel(model);
    let doc = null;
    if (include) {
      doc = await this.prismaService[prismaModel].findUnique({
        where: { id: Number(id) },
        include: include
      });
    } else {
      doc = await this.prismaService[prismaModel].findUnique({
        where: { id: Number(id) }
      });
    }

    if (!doc) {
      throw new NotFoundException(`${model} not found`);
    }

    return {
      [model]: this.utilService.filterResponse(doc)
    };
  }

  async createOne(model: string, body: any): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].create({
      data: body,
    });

    return {
      [model]: this.utilService.filterResponse(doc)
    };
  }

  async updateOne(model: string, id: string, body: any, include: object = null): Promise<any> {
    const prismaModel = this.apiService.getModel(model);
    let doc = null;

    if(include) {
      doc = await this.prismaService[prismaModel].update({
        where: { id: Number(id) },
        data: body,
        include: include
      });
    } else {
      doc = await this.prismaService[prismaModel].update({
        where: { id: Number(id) },
        data: body,
      });
    }

    if (!doc) {
      throw new NotFoundException(`${model} not found`);
    }

    return {
      [model]: this.utilService.filterResponse(doc)
    };
  }

  async deleteOne(model: string, id: string): Promise<any> {
    const prismaModel = this.apiService.getModel(model);

    const doc = await this.prismaService[prismaModel].delete({
      where: { id: Number(id) },
    });

    if (!doc) {
      throw new NotFoundException(`${model} not found`);
    }

    return {
      data: null,
    };
  }
}

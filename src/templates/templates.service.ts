import { Injectable } from '@nestjs/common';
import { CreateTemplateDto, UpdateTemplateDto } from './dtos';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilService } from 'src/common/providers';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService
  ) { }

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

  async getAllTemplatesByType(templateType: string, search: string): Promise<any> {
    try {
      const templates = await this.prismaService.template.findMany({
        where: {
          type: templateType,
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      });

      return {
        results: templates.length,
        templates: templates.map(template => this.utilService.filterResponse(template))
      }
    } catch (error) {
      throw error;
    }
  }

  async createTemplate(body: CreateTemplateDto, background: Express.Multer.File): Promise<any> {
    try {
      // create random file name
      const fileName = `template-${Date.now()}`;
      // upload file
      const { error: storageError } = await this.supabase.storage
        .from('avatars') // Bucket name
        .upload(fileName, background.buffer);

      if (storageError) {
        throw new Error(storageError.message);
      }

      // create template record
      const template = await this.prismaService.template.create({
        data: {
          ...body,
          defaultBackground: `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/templates/${fileName}`
        }
      });

      return {
        template: this.utilService.filterResponse(template)
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTemplate(id: number, body: UpdateTemplateDto, background: Express.Multer.File): Promise<any> {
    try {
      let template = null;
      let fileName = null;
      if (background) {
        // create random file name
        fileName = `template-${Date.now()}`;
        // upload file
        const { error: storageError } = await this.supabase.storage
          .from('avatars') // Bucket name
          .upload(fileName, background.buffer);

        if (storageError) {
          throw new Error(storageError.message);
        }
      }

      if (fileName) {
        // update template record
        template = await this.prismaService.template.update({
          where: { id },
          data: {
            ...body,
            defaultBackground: `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/templates/${fileName}`
          }
        });
      } else {
        template = await this.prismaService.template.update({
          where: { id },
          data: { ...body }
        });
      }

      return {
        template: this.utilService.filterResponse(template)
      }
    } catch (error) {
      throw error;
    }
  }
}

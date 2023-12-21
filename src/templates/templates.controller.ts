import { Body, Controller, Delete, FileTypeValidator, Get, Param, ParseFilePipe, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CRUDService } from 'src/common/providers';
import { JwtAuthGuard } from 'src/auth/guards';
import { Role, Roles, RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { CreateTemplateDto, UpdateTemplateDto } from './dtos';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly crudService: CRUDService
  ) { }

  @Get()
  async getAllTemplates(@Query() options: any): Promise<any> {
    try {
      const result = await this.crudService.getAll('template', options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('by-type/:templateType')
  getAllTemplatesByType(@Param('templateType') templateType: string, @Query('search') search: string): any {
    return this.templatesService.getAllTemplatesByType(templateType, search);
  }

  @Get(':id')
  async getTemplate(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.getOne('template', id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('defaultBackground'))
  createTemplate(
    @Body() body: CreateTemplateDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    ) background: Express.Multer.File,
  ): any {
    return this.templatesService.createTemplate(body, background);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('defaultBackground'))
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTemplateDto,
    @UploadedFile() background: Express.Multer.File,
  ): any {
    return this.templatesService.updateTemplate(id, body, background);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteTemplate(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('template', id);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

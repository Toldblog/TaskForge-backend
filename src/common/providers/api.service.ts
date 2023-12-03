import { Injectable } from '@nestjs/common';

@Injectable()
export class APIService {
  constructor() { }

  getFilterObj(options: any): any {
    const queryObj = { ...options };

    const excludeFields = ['page', 'sort', 'limit', 'fields', 'page', 'limit'];
    excludeFields.forEach((el) => delete queryObj[el]);

    const prismaFilter = {};
    for (const key in queryObj) {
      if (typeof queryObj[key] === 'object' && queryObj[key] !== null) {
        for (const condition in queryObj[key]) {
          if (['gte', 'gt', 'lte', 'lt'].includes(condition)) {
            prismaFilter[key] = {
              [condition]: queryObj[key][condition],
            };
          }
        }
      } else {
        prismaFilter[key] = queryObj[key];
      }
    }

    return prismaFilter;
  }

  getSortObj(options: any): any {
    const sortBy = options?.sort?.split(',');

    if (sortBy && sortBy.length === 1) {
      const [field] = sortBy;
      const direction = field.startsWith('-') ? 'desc' : 'asc';
      const fieldName = field.replace(/^-/, '');
      return { [fieldName]: direction };
    } else if (sortBy) {
      return sortBy.map((field: string) => {
        const direction = field.startsWith('-') ? 'desc' : 'asc';
        const fieldName = field.replace(/^-/, '');
        return { [fieldName]: direction };
      });
    } else {
      return { createdAt: 'asc' };
    }
  }

  getSelectedFields(options: any): any {
    if (options.fields) {
      const fields = options.fields
        .split(',')
        .map((field: string) => {
          // Remove password field from selection
          return field.trim().toLowerCase() === 'password' ? '' : field.trim();
        })
        .filter(Boolean); // Remove empty strings
      return {
        ...Object.fromEntries(fields.map((field: any) => [field, true])),
        __v: false, // Exclude __v field
      };
    } else {
      // If no specific fields are mentioned, select all fields except __v and password
      return {
        __v: false,
        password: false
      };
    }
  }

  getPagination(options: any): { skip: number, take: number } {
    const page = +options.page || 1;
    const limit = +options.limit || 100;
    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit
    }
  }

  getModel(model: string): string {
    return model.toLowerCase();
  }
}

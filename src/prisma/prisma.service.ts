import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL}`,
        },
      },
    });

    this.$use(async (params, next) => {
      // Check incoming query type
      if (params.model == 'User') {
        if (params.action == 'update') {
          params.args['data'] = {
            password: params.args.data?.password,
            changePasswordAt: new Date(Date.now() - 1500)
          }
        }
      }
      return next(params)
    })
  }
}

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  async (_data, ctx: ExecutionContext): Promise<User> => {
    const req = await ctx.switchToHttp().getRequest();
    return req.user;
  },
);

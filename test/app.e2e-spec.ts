import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { SignUpCredentialsDto } from 'src/auth/dtos';

describe('App e2e', () => {
  let app: INestApplication;
  // let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
  });

  afterAll(() => {
    app.close();
  });

  let token: string | undefined;
  describe('Auth', () => {
    const dtoSignUp: SignUpCredentialsDto = {
      username: 'user2',
      email: 'user2@gmail.com',
      name: 'user2',
      password: 'Test1234',
      passwordConfirm: 'Test1234',
    };
    const dtoSignIn = {
      email: 'admin@natours.io',
      password: 'Test1234',
    };
    const dtoSignInWrongPwd = {
      email: 'admin@natours.io',
      password: 'Test123',
    };
    const dtoSignInEmailNotFound = {
      email: 'admin@natours.i',
      password: 'Test1234',
    };
    const dtoSignInActiveFalse = {
      email: 'user2@gmail.com',
      password: 'Test1234',
    };
    describe('Sign Up', () => {
      // it('should sign up', () => {
      //   return pactum.spec().post('http://localhost:3000/api/auth/signup').withBody(dtoSignUp).expectStatus(201);
      // });

      it('should throw error because username aldready exists', () => {
        return pactum.spec().post('http://localhost:3000/api/auth/signup').withBody(dtoSignUp).expectStatus(400);
      });
    });

    describe('Sign In', () => {
      it('should sign in and store the token', async () => {
        const response = await pactum
          .spec()
          .post('http://localhost:3000/api/auth/signin')
          .withBody(dtoSignIn)
          .expectStatus(200)
          .inspect();

        token = response.body.data.accessToken;
      });

      it('should throw error if password is wrong in', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/auth/signin')
          .withBody(dtoSignInWrongPwd)
          .expectStatus(400);
      });
      it('should throw if email is not found', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/auth/signin')
          .withBody(dtoSignInEmailNotFound)
          .expectStatus(401);
      });
      it('should throw if the account is not activated', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/auth/signin')
          .withBody(dtoSignInActiveFalse)
          .expectStatus(401);
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users/me')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200)
          .inspect();
      });

      it('should throw if token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users/me')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401)
          .inspect();
      });
    });

    describe('Get all users', () => {
      it('should get all users', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200)
          .inspect();
      });

      it('should throw if token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401)
          .inspect();
      });
    });

    describe('Get user by ID', () => {
      it('should get user contain that ID', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users/10')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200)
          .inspect();
      });

      it('should throw if user id not found', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users/100')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(404)
          .inspect();
      });

      it('should throw if token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/users/10')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401)
          .inspect();
      });
    });
  });

  describe('Workspace', () => {
    describe('Get all workspaces', () => {
      it('should get all workspace that user have', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200);
        // .inspect();
      });

      it('should throw if the token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401);
        // .inspect();
      });

      it('should throw if the user are not signing in', () => {
        return pactum.spec().get('http://localhost:3000/api/workspaces').expectStatus(401);
        // .inspect();
      });
    });

    describe('Get all of my workspaces', () => {
      it('should get all workspace that user have', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/workspaces/my-workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200);
        // .inspect();
      });

      it('should throw if the token is unauthorized', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/workspaces/my-workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401);
      });
    });

    describe('Create workspace', () => {
      it('should throw if the body of request lack of name or description for that workspace', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .withBody({
            description: 'This is CS300 workspace of group 1',
          })
          .expectStatus(400);
      });

      it('should throw if the token is invalid', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/workspaces')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .withBody({
            name: 'CS300',
            description: 'This is CS300 workspace of group 1',
          })
          .expectStatus(401);
      });
    });
  });

  describe('Templates', () => {
    describe('Get all templates', () => {
      it('should get all templates', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/templates')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200);
      });
      it('should throw if token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/templates')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401);
      });
      it('should throw if the user is not signing in', () => {
        return pactum.spec().get('http://localhost:3000/api/templates').expectStatus(401);
      });
    });

    describe('Create a template', () => {
      it('should throw if the the body is lack of nescessary information used for that template', () => {
        return pactum.spec().post('http://localhost:3000/api/templates').withBody({
          name:'My template',
          type: 'Engineer'
        }).expectStatus(401);
      });
    });

    describe('Delete a template', () => {
      it('should throw if the template is not found', () => {
        return pactum.spec().delete('http://localhost:3000/api/templates/100').withHeaders({
            Authorization: `Bearer ${token}`,
          }).expectStatus(404);
      });

      it('should throw if the user is not signing in', () => {
        return pactum
          .spec()
          .delete('http://localhost:3000/api/templates/1')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401);
      });
    });
  });

  describe('Boards', () => {
    describe('Get all my boards', () => {
      it('should get all boards that user have joined in', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/boards')
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(200);
        // .inspect();
      });

      it('should throw if user are not signing in', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/boards')
          .expectStatus(401);
        // .inspect();
      });

      it('should throw if token is invalid', () => {
        return pactum
          .spec()
          .get('http://localhost:3000/api/boards')
          .withHeaders({
            Authorization: `Bearer ${token}a`,
          })
          .expectStatus(401);
        // .inspect();
      });
    })

    describe('Create a Board', () => {
      it('should create Board', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/boards')
          .withBody({
            name: 'Software project',
            workspaceId: 3,
            templateId: 5,
            visibility: false,
          })
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(201).inspect();
      });

      it('should throw if the body is lack of nescessary information used for that board', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/boards')
          .withBody({
            name: 'Software project',
            workspaceId: 3,
          })
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(400);
      });

      it('should throw if the user is not signing in', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/boards')
          .withBody({
            name: 'Software project',
            workspaceId: 1,
            templateId: 5,
            visibility: false,
          })
          .expectStatus(401);
      });

      it('should throw if the workspace id is not found', () => {
        return pactum
          .spec()
          .post('http://localhost:3000/api/boards')
          .withBody({
            name: 'Software project',
            workspaceId: 100,
            templateId: 5,
            visibility: false,
          })
          .withHeaders({
            Authorization: `Bearer ${token}`,
          })
          .expectStatus(404);
      });
    });
  })
});

import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

let service: AuthService;
let fakeUsersService: Partial<UsersService>;

describe('AuthService', () => {
  beforeEach(async () => {
    //Create fake copy of user service

    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          email,
          password,
          id: Math.floor(Math.random() * 99999),
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create a instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('Creates a new user with salted and hashed password', async () => {
    const user = await service.signup('as@asd.com', '123456');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('Throws an error if user tries to sign in with an email that is in use ', async () => {
    fakeUsersService.find = () => {
      return Promise.resolve([
        { id: 1, email: 'john.doe@email.com', password: 'fsafsa' } as User,
      ]);
    };
    // await service.signup('jane.doe@email.com', '123456');
    await expect(
      service.signup('john.doe@email.com', 'fsafsa'),
    ).rejects.toThrow(BadRequestException);
  });
  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('asdflkj@asdlfkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        { email: 'asdf@asdf.com', password: 'laskdjf' } as User,
      ]);
    await expect(
      service.signin('laskdjf@alskdfj.com', 'passowrd'),
    ).rejects.toThrow(BadRequestException);
  });

  it('Return a user in case of perfect password', async () => {
    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     {
    //       email: 'asdf@asdf.com',
    //       password:
    //         '5a7c31fab413b4fa.e5de8210805896067eaaa0d79f68602de66a51d5014a55a57fef8fbbc8420dbb',
    //     } as User,
    //   ]);

    await service.signup('asd@asd.com', 'password');

    const user = await service.signin('asd@asd.com', 'password');
    expect(user).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asdf@asdf.com', 'asdf');
    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('asdflkj@asdlfkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('laskdjf@alskdfj.com', 'password');
    await expect(
      service.signin('laskdjf@alskdfj.com', 'laksdlfkj'),
    ).rejects.toThrow(BadRequestException);
  });
});

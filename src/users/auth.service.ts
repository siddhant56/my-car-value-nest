import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    //See if email is in use
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('Email In Use');
    }
    //Hash users password

    //Generate Salt

    const salt = randomBytes(8).toString('hex');

    //Hash salt and password

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    //Join hashed result and salt together

    const result = salt + '.' + hash.toString('hex');

    //Create a new user save it

    const user = await this.usersService.create(email, result);
    //Return user

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    // console.log(user);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Bad Password');
    }

    return user;
  }
}

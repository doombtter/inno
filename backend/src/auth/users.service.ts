import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import type { Role, UserRecord } from './types';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  created_at: Date;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly log = new Logger(UsersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  /// On server start: if there's no admin in the DB and the env provides
  /// bootstrap credentials, seed a first admin. Production should set these
  /// once, then rotate the password from the admin UI (when that lands) or
  /// directly in SQL.
  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL');
    const password = this.config.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    const name = this.config.get<string>('BOOTSTRAP_ADMIN_NAME') ?? 'Admin';
    if (!email || !password) return;

    const { rowCount } = await this.db.query(
      `SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`,
    );
    if (rowCount && rowCount > 0) return;

    await this.create({ email, password, name, role: 'admin' });
    this.log.log(`Bootstrapped admin user '${email}' from BOOTSTRAP_ADMIN_*`);
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT id, email, name, role, password_hash, created_at
       FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT id, email, name, role, password_hash, created_at
       FROM users WHERE id = $1`,
      [id],
    );
    const r = rows[0];
    return r ? this.toRecord(r) : null;
  }

  async create(input: {
    email: string;
    password: string;
    name: string;
    role: Role;
  }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    if (await this.findByEmail(email)) {
      throw new ConflictException(`User '${email}' already exists`);
    }
    const hash = await bcrypt.hash(input.password, 10);
    const { rows } = await this.db.query<UserRow>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, password_hash, created_at`,
      [email, hash, input.name, input.role],
    );
    return this.toRecord(rows[0]!);
  }

  async verifyPassword(email: string, password: string): Promise<UserRecord> {
    const row = await this.findByEmail(email.trim().toLowerCase());
    if (!row) throw new UnauthorizedException('Invalid email or password');
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    return this.toRecord(row);
  }

  private toRecord(row: UserRow): UserRecord {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at.toISOString(),
    };
  }
}

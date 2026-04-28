# Bolt AI Prompt — AuthModule + UsersModule + FileModule + CategoriesModule + ServicesModule (AI-powered via Claude Sonnet 4.6)

## What this does

This prompt builds the complete NestJS `AuthModule`, `UsersModule`, `FilesModule`, `CategoriesModule`, and `ServicesModule` — local register/login, Google OAuth, Telegram Login Widget, JWT token issuance, refresh token rotation, user profile management, self-service account operations, MinIO S3-backed file storage with presigned URL delivery, category listing with Redis caching, and service discovery with a full availability calculation engine — as a standalone Bolt artifact powered by the Anthropic API (`claude-sonnet-4-6`).

The artifact will be an interactive dashboard where you can:
- Test each auth flow visually
- See the generated NestJS code for each file
- Ask Claude to explain or modify any part of the implementation

---

## Anthropic API call setup

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }]
  })
});
const data = await response.json();
const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
```

---

## System prompt to use

```
You are a senior NestJS backend engineer. You generate complete, production-ready NestJS code using:
- NestJS v10 with TypeScript strict mode
- Drizzle ORM with postgres driver
- Redis via ioredis for slot locks and caching
- Passport.js with passport-jwt and passport-google-oauth20
- bcrypt for password hashing (cost factor 12)
- RS256 JWT (access token 15 min, refresh token 30 days, rotated on each refresh)
- MinIO SDK (@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner) for object storage

When asked to generate a file, output ONLY the complete TypeScript file content.
No explanations, no markdown fences, no preamble.
File must be immediately usable — all imports included, all types correct.

When asked a question, answer concisely and technically.
Assume the shared infrastructure (DatabaseModule, RedisModule, ConfigModule, all Drizzle schemas) already exists exactly as defined in the project scaffold.

Key conventions to follow in all generated code:
- Use this.db.db for all Drizzle queries (DatabaseService exposes a .db property)
- TypeScript is in loose mode: strictNullChecks: false, noImplicitAny: false
- esModuleInterop: true — use default imports for postgres, ioredis
- Use expiresIn: accessExpiry as any when calling jwtService.sign (type narrowing workaround)
- Access (req as any).user in controllers where Express Request type doesn't include user
- Config env vars for storage use S3_* prefix (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_PRESIGN_EXPIRY_SECONDS, S3_REGION) and are accessed via ConfigService.get('storage.*')
```

---

## Full build prompt (paste this as the user message)

```
Build the complete NestJS AuthModule, UsersModule, FilesModule, CategoriesModule, and ServicesModule for a booking platform. All modules must be self-contained and work with the existing shared infrastructure.

## Scope

Generate all of the following files completely:

### AuthModule (11 files)
1.  src/auth/auth.module.ts
2.  src/auth/auth.controller.ts
3.  src/auth/oauth.controller.ts
4.  src/auth/auth.service.ts
5.  src/auth/strategies/jwt.strategy.ts
6.  src/auth/strategies/google.strategy.ts
7.  src/auth/strategies/telegram.strategy.ts
8.  src/auth/dto/register.dto.ts
9.  src/auth/dto/login.dto.ts
10. src/auth/dto/refresh.dto.ts
11. src/auth/dto/telegram-auth.dto.ts

### UsersModule (6 files)
12. src/users/users.module.ts
13. src/users/users.controller.ts
14. src/users/users.service.ts
15. src/users/users.repository.ts
16. src/users/dto/update-profile.dto.ts
17. src/users/dto/user-response.dto.ts

### FilesModule (7 files)
18. src/files/files.module.ts
19. src/files/files.controller.ts
20. src/files/files.service.ts
21. src/files/files.repository.ts
22. src/files/minio.service.ts
23. src/files/dto/file-response.dto.ts
24. src/files/dto/upload-file.dto.ts

### CategoriesModule (4 files)
25. src/categories/categories.module.ts
26. src/categories/categories.controller.ts
27. src/categories/categories.service.ts
28. src/categories/categories.repository.ts

### ServicesModule (6 files)
29. src/services/services.module.ts
30. src/services/services.controller.ts
31. src/services/services.service.ts
32. src/services/services.repository.ts
33. src/services/availability.service.ts
34. src/services/dto/service-list-query.dto.ts

---

## Detailed requirements — FilesModule

### Database schema additions (add to src/database/schema.ts)

New table `files` (already present in the project — do not recreate if it exists):
```ts
export const files = pgTable('files', {
  id:           uuid('id').primaryKey().defaultRandom(),
  bucket:       varchar('bucket', { length: 100 }).notNull(),
  objectKey:    varchar('object_key', { length: 500 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType:     varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes:    integer('size_bytes').notNull(),
  // @ts-ignore — TS2883 false positive with nullable FK + declaration: true
  uploadedBy:   uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export type InsertFile = typeof files.$inferInsert;
export type SelectFile = typeof files.$inferSelect;
```

New tables for CategoriesModule and ServicesModule (add these to schema.ts):
```ts
// Categories
export const categories = pgTable('categories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  colorHex:    varchar('color_hex', { length: 7 }),
  sortOrder:   integer('sort_order').notNull().default(0),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;

// Businesses (owned by users with role 'business_owner')
export const businesses = pgTable('businesses', {
  id:          uuid('id').primaryKey().defaultRandom(),
  ownerId:     uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name:        varchar('name', { length: 200 }).notNull(),
  slug:        varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  address:     text('address'),
  logoUrl:     text('logo_url'),
  phone:       varchar('phone', { length: 30 }),
  status:      varchar('status', { length: 30 }).notNull().default('active'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

export type InsertBusiness = typeof businesses.$inferInsert;
export type SelectBusiness = typeof businesses.$inferSelect;

// Services
export const services = pgTable('services', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  businessId:         uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  categoryId:         uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name:               varchar('name', { length: 200 }).notNull(),
  description:        text('description'),
  priceCents:         integer('price_cents').notNull(),
  durationMinutes:    integer('duration_minutes').notNull(),
  coverImageUrl:      text('cover_image_url'),
  cancellationPolicy: text('cancellation_policy'),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
});

export type InsertService = typeof services.$inferInsert;
export type SelectService = typeof services.$inferSelect;

// Availability rules — recurring weekly schedule per service
export const availabilityRules = pgTable('availability_rules', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  serviceId:           uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  dayOfWeek:           varchar('day_of_week', { length: 10 }).notNull(), // 'monday'..'sunday'
  startTime:           varchar('start_time', { length: 8 }).notNull(),   // 'HH:mm:ss'
  endTime:             varchar('end_time', { length: 8 }).notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull(),
  isActive:            boolean('is_active').notNull().default(true),
});

export type InsertAvailabilityRule = typeof availabilityRules.$inferInsert;
export type SelectAvailabilityRule = typeof availabilityRules.$inferSelect;

// Availability blocks — one-off date overrides (whole day or time range)
export const availabilityBlocks = pgTable('availability_blocks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  blockDate: varchar('block_date', { length: 10 }).notNull(),    // 'YYYY-MM-DD'
  startTime: varchar('start_time', { length: 8 }),               // null = whole day blocked
  endTime:   varchar('end_time', { length: 8 }),
  reason:    text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type InsertAvailabilityBlock = typeof availabilityBlocks.$inferInsert;
export type SelectAvailabilityBlock = typeof availabilityBlocks.$inferSelect;

// Slot locks — short-lived Redis-backed reservation during checkout (DB row is audit log only)
export const slotLocks = pgTable('slot_locks', {
  id:             uuid('id').primaryKey().defaultRandom(),
  serviceId:      uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  slotDate:       varchar('slot_date', { length: 10 }).notNull(),   // 'YYYY-MM-DD'
  slotTime:       varchar('slot_time', { length: 8 }).notNull(),    // 'HH:mm'
  lockedByUserId: uuid('locked_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt:      timestamp('expires_at').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export type InsertSlotLock = typeof slotLocks.$inferInsert;
export type SelectSlotLock = typeof slotLocks.$inferSelect;
```

### MinIO / S3 configuration (already in ConfigModule namespace 'storage')

Environment variables (already configured in the project — use these exact names):
- S3_ENDPOINT           — e.g. "http://localhost:9000"
- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_BUCKET             — default bucket name, e.g. "booking-uploads"
- S3_PRESIGN_EXPIRY_SECONDS — default 3600 (1 hour)
- S3_REGION             — default "us-east-1"

Access via ConfigService: `config.get('storage.endpoint')`, `config.get('storage.accessKey')`, etc.

### files.module.ts
- Providers: FilesService, FilesRepository, MinioService
- Exports: FilesService (so BookingsModule, ServicesModule and other feature modules can call it)
- Imports: nothing extra (DatabaseModule is @Global())
- Decorated with @Global() so FilesService is injectable anywhere without re-importing

### minio.service.ts
Injectable service that wraps @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner.

Constructor: inject ConfigService. Build and store an S3Client instance:
```ts
this.client = new S3Client({
  endpoint: config.endpoint,
  region:   config.region,
  credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
  forcePathStyle: true,   // required for MinIO
});
```

Methods:

`upload(bucket: string, objectKey: string, body: Buffer, contentType: string): Promise<void>`
- Execute PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: contentType })
- Throw InternalServerErrorException on S3 error

`getPresignedUrl(bucket: string, objectKey: string, expiresInSeconds?: number): Promise<string>`
- Use getSignedUrl from @aws-sdk/s3-request-presigner
- Command: GetObjectCommand({ Bucket: bucket, Key: objectKey })
- expiresIn defaults to config.presignExpirySeconds
- Return the signed URL string

`delete(bucket: string, objectKey: string): Promise<void>`
- Execute DeleteObjectCommand({ Bucket: bucket, Key: objectKey })
- Throw InternalServerErrorException on S3 error

`ensureBucket(bucket: string): Promise<void>`
- Execute HeadBucketCommand to check existence
- If NoSuchBucket error (or 404), execute CreateBucketCommand
- Called once on application bootstrap (in FilesService.onModuleInit)

### files.service.ts

Implements OnModuleInit — calls minioService.ensureBucket(defaultBucket) in onModuleInit.

Methods:

`uploadFile(file: Express.Multer.File, uploadedBy: string | null, subfolder?: string): Promise<SelectFile>`
- Generate objectKey: `${subfolder ?? 'uploads'}/${Date.now()}-${uuidv4()}-${file.originalname.replace(/[^a-z0-9.\-_]/gi, '_')}`
- Call minioService.upload(bucket, objectKey, file.buffer, file.mimetype)
- Insert a row into files table via filesRepository.create({ bucket, objectKey, originalName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size, uploadedBy })
- Return the inserted SelectFile record

`getFileUrl(fileId: string): Promise<string>`
- Load file record via filesRepository.findById(fileId) — throw NotFoundException('File not found') if null
- Call minioService.getPresignedUrl(file.bucket, file.objectKey)
- Return the presigned URL string

`getFileUrls(fileIds: string[]): Promise<Record<string, string>>`
- Batch-load file records via filesRepository.findByIds(fileIds)
- Generate presigned URLs for all records in parallel (Promise.all)
- Return a map of fileId → presignedUrl
- Missing IDs (file not found) are silently omitted from the result map

`deleteFile(fileId: string): Promise<void>`
- Load file record, throw NotFoundException if missing
- Call minioService.delete(file.bucket, file.objectKey)
- Delete the database row via filesRepository.delete(fileId)

### files.repository.ts
Thin Drizzle wrapper. Inject DatabaseService.

Methods:
- `findById(id: string): Promise<SelectFile | null>`
    select from files where id = id limit 1

- `findByIds(ids: string[]): Promise<SelectFile[]>`
    select from files where id in (ids) — use Drizzle's `inArray(files.id, ids)`

- `create(data: Omit<InsertFile, 'id' | 'createdAt'>): Promise<SelectFile>`
    insert into files values(data) returning *

- `delete(id: string): Promise<void>`
    delete from files where id = id

### files.controller.ts
Base path: /files
All endpoints require @UseGuards(JwtAuthGuard).

Endpoints:

`POST /files/upload`
- @UseInterceptors(FileInterceptor('file')) — Multer in-memory storage (no disk writes)
- Body param: @UploadedFile() file: Express.Multer.File
- Optional query param: subfolder?: string
- Calls filesService.uploadFile(file, currentUser.id, subfolder)
- Returns FileResponseDto

`GET /files/:id/url`
- Calls filesService.getFileUrl(id)
- Returns { url: string }

`DELETE /files/:id`
- Calls filesService.deleteFile(id)
- Returns { message: 'File deleted' }

### dto/file-response.dto.ts
```ts
@Exclude()
export class FileResponseDto {
  @Expose() id: string;
  @Expose() originalName: string;
  @Expose() mimeType: string;
  @Expose() sizeBytes: number;
  @Expose() createdAt: Date;

  constructor(partial: Partial<FileResponseDto>) {
    Object.assign(this, partial);
  }
}
```
Note: bucket and objectKey are intentionally NOT exposed — internal storage details are never leaked to clients.

### dto/upload-file.dto.ts
```ts
export class UploadFileDto {
  @IsOptional() @IsString() subfolder?: string;
}
```

---

## Integration — BookingsModule changes

### When creating a booking service (e.g. POST /bookings or POST /services)

1. Accept image uploads via `@UseInterceptors(FilesInterceptor('images', 10))` (up to 10 images).
2. For each uploaded file call `filesService.uploadFile(file, currentUser.id, 'bookings')`.
3. Collect the returned `SelectFile` IDs.
4. Store these IDs in the booking/service row. Add a `imageFileIds uuid[]` column to the relevant Drizzle table, or use a join table `booking_images(booking_id, file_id, sort_order)` if ordering matters.
5. Do NOT store raw URLs in the database — only the file record IDs. URLs are generated on demand and expire.

### When reading a booking service that displays images (e.g. GET /bookings/:id, GET /services, GET /services/:id)

1. Load the booking/service row as usual.
2. Extract the list of `imageFileIds` from the record.
3. If the list is non-empty, call `filesService.getFileUrls(imageFileIds)` to get a `Record<fileId, presignedUrl>`.
4. Map the presigned URLs into the response DTO as `imageUrls: string[]` (ordered by the original ID list).
5. Never return raw `objectKey` or `bucket` values to the frontend — only the presigned URL.

Example pattern in a service method:
```ts
async getServiceById(id: string): Promise<ServiceResponseDto> {
  const service = await this.servicesRepository.findById(id);
  if (!service) throw new NotFoundException('Service not found');

  let imageUrls: string[] = [];
  if (service.imageFileIds?.length) {
    const urlMap = await this.filesService.getFileUrls(service.imageFileIds);
    imageUrls = service.imageFileIds.map(fid => urlMap[fid]).filter(Boolean);
  }

  return new ServiceResponseDto({ ...service, imageUrls });
}
```

### BookingsModule / ServicesModule dependency
- Import FilesModule (it is @Global() so no explicit import needed, but document it for clarity).
- Inject FilesService via constructor DI.
- Do NOT call MinioService directly from BookingsModule — always go through FilesService.

---

## Detailed requirements — AuthModule

### auth.module.ts
- Import UsersModule (it exists at src/users/users.module.ts and exports UsersService)
- Import JwtModule using registerAsync, read privateKey and accessExpiry from ConfigService (namespace: 'jwt'), algorithm RS256
- Import PassportModule with defaultStrategy: 'jwt'
- Provide: AuthService, JwtStrategy, GoogleStrategy, TelegramStrategy
- Export: AuthService, JwtAuthGuard, OptionalAuthGuard
- Do NOT redeclare JwtAuthGuard or OptionalAuthGuard here — they live in src/common/guards/ and are imported

### auth.controller.ts
Endpoints:
- POST /auth/register → body: RegisterDto → returns { accessToken, refreshToken, user }
- POST /auth/login    → body: LoginDto    → returns { accessToken, refreshToken, user }
- POST /auth/refresh  → body: RefreshDto  → returns { accessToken, refreshToken }
- POST /auth/logout   → @UseGuards(JwtAuthGuard), @CurrentUser() user → deletes all refresh tokens for user, returns { message: 'Logged out' }

Apply @UseGuards(ThrottlerGuard) to register and login — rate limit is handled by NestJS ThrottlerModule (assume it is configured globally at 10 requests per 60 seconds).

### oauth.controller.ts
Endpoints:
- GET  /auth/google            → @UseGuards(AuthGuard('google')) — no body, Passport handles redirect
- GET  /auth/google/callback   → @UseGuards(AuthGuard('google')) — on success calls authService.issueTokens(user.id) then redirects to {FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...
- POST /auth/telegram          → body: TelegramAuthDto, calls authService.handleTelegramAuth(dto), returns { accessToken, refreshToken, user }

### auth.service.ts
Methods:

register(dto: RegisterDto): Promise<TokenPair & { user: SafeUser }>
- Check email uniqueness against users table (throw ConflictException if taken)
- Hash password: await bcrypt.hash(dto.password, 12)
- Insert user row via DatabaseService
- Call issueTokens(userId)
- Return tokens + sanitized user (omit passwordHash)

login(dto: LoginDto): Promise<TokenPair & { user: SafeUser }>
- Find user by email (throw UnauthorizedException if not found or isActive false)
- Compare password: await bcrypt.compare(dto.password, user.passwordHash) (throw UnauthorizedException if false)
- Call issueTokens(userId)
- Return tokens + sanitized user

issueTokens(userId: string): Promise<TokenPair>
- Sign access token: jwtService.sign({ sub: userId, role: user.role }, { expiresIn: accessExpiry, algorithm: 'RS256', privateKey })
- Generate refresh token: crypto.randomBytes(40).toString('hex')
- Hash it: crypto.createHash('sha256').update(refreshToken).digest('hex')
- Insert into refresh_tokens table: { userId, tokenHash, expiresAt: now + 30 days, ipAddress from request (inject REQUEST via @Inject(REQUEST)), userAgent }
- Return { accessToken, refreshToken } (raw, unhashed)

refreshTokens(rawToken: string): Promise<TokenPair>
- Hash incoming token, find row in refresh_tokens where tokenHash = hash AND isRevoked = false AND expiresAt > now (throw UnauthorizedException if not found)
- Delete the old row (rotation)
- Call issueTokens(userId)

revokeAllTokens(userId: string): Promise<void>
- Delete all refresh_tokens rows for userId

findOrCreateOAuthUser(provider: 'google' | 'telegram', providerUserId: string, profile: { email?: string; fullName: string; avatarUrl?: string }): Promise<SelectUser>
- Query oauth_accounts where provider = provider AND providerUserId = providerUserId
- If found: return linked user
- If email provided: check if user with that email exists → if yes, insert oauth_accounts row linking to them, return user
- If no match: insert new user row (role: 'customer', isEmailVerified: false for Telegram, true for Google) then insert oauth_accounts row — wrap both inserts in a single Drizzle transaction

handleTelegramAuth(dto: TelegramAuthDto): Promise<TokenPair & { user: SafeUser }>
- Delegate HMAC verification to TelegramStrategy.verify(dto) — throw UnauthorizedException if invalid
- Call findOrCreateOAuthUser('telegram', dto.id.toString(), { fullName: dto.first_name, avatarUrl: dto.photo_url })
- Call issueTokens

### strategies/jwt.strategy.ts
- Extend PassportStrategy(Strategy, 'jwt') from passport-jwt
- ExtractJwt.fromAuthHeaderAsBearerToken()
- Algorithm: RS256, secretOrKey is the PUBLIC key (read from ConfigService 'jwt.publicKey')
- validate(payload: { sub: string; role: string }): return { id: payload.sub, role: payload.role }

### strategies/google.strategy.ts
- Extend PassportStrategy(Strategy, 'google') from passport-google-oauth20
- clientID, clientSecret, callbackURL from ConfigService 'oauth.google.*'
- scope: ['email', 'profile']
- validate(accessToken, refreshToken, profile, done): extract email (profile.emails[0].value), fullName (profile.displayName), avatarUrl (profile.photos[0]?.value), call authService.findOrCreateOAuthUser('google', profile.id, { email, fullName, avatarUrl }), call done(null, user)

### strategies/telegram.strategy.ts
- NOT a Passport strategy — a plain @Injectable() service
- verify(dto: TelegramAuthDto): boolean
  - Build data_check_string: take all dto fields EXCEPT hash, sort keys alphabetically, join as "key=value\n" (no trailing newline)
  - secretKey = crypto.createHash('sha256').update(botToken).digest()  ← raw Buffer, not hex string
  - expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  - Check: dto.hash === expectedHash  AND  Date.now()/1000 - dto.auth_date < 86400
  - Return true or false

### dto/register.dto.ts
```ts
class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
  @IsString() @MinLength(2) @MaxLength(200) fullName: string;
}
```

### dto/login.dto.ts
```ts
class LoginDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() password: string;
}
```

### dto/refresh.dto.ts
```ts
class RefreshDto {
  @IsString() @IsNotEmpty() refreshToken: string;
}
```

### dto/telegram-auth.dto.ts
```ts
class TelegramAuthDto {
  @IsNumber() id: number;
  @IsString() first_name: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() photo_url?: string;
  @IsNumber() auth_date: number;
  @IsString() hash: string;
}
```

## Types to define inline in auth.service.ts

```ts
type TokenPair = { accessToken: string; refreshToken: string };
type SafeUser  = Omit<SelectUser, 'passwordHash'>;
```

## AuthModule error handling rules
- Email already taken → ConflictException('Email already in use')
- User not found or inactive → UnauthorizedException('Invalid credentials')
- Wrong password → UnauthorizedException('Invalid credentials') — same message intentionally (no user enumeration)
- Expired or revoked refresh token → UnauthorizedException('Refresh token is invalid or expired')
- Telegram HMAC mismatch → UnauthorizedException('Telegram auth data is invalid')
- Any unexpected DB error → let it bubble — AllExceptionsFilter catches it and returns 500

---

## Detailed requirements — UsersModule

### users.module.ts
- Decorated with @Global() so UsersService is available across the application without re-importing
- Providers: UsersService, UsersRepository
- Exports: UsersService
- Imports: nothing (DatabaseModule is already @Global())
- Do NOT import AuthModule — dependency goes only one way: AuthModule imports UsersModule

### users.controller.ts
All endpoints are protected with @UseGuards(JwtAuthGuard). The authenticated user's ID is read from @CurrentUser().

Endpoints:
- GET    /users/me          → @CurrentUser() user → calls usersService.findById(user.id) → returns UserResponseDto
- PATCH  /users/me          → @CurrentUser() user, body: UpdateProfileDto → calls usersService.updateProfile(user.id, dto) → returns UserResponseDto
- DELETE /users/me          → @CurrentUser() user → calls usersService.deactivate(user.id) → returns { message: 'Account deactivated' }

Rate-limit PATCH and DELETE with @UseGuards(ThrottlerGuard) at the method level (same global ThrottlerModule, 10 req / 60 s).

### users.service.ts
Methods:

findById(id: string): Promise<SelectUser | null>
- Delegates to usersRepository.findById(id)
- Returns raw SelectUser or null — callers decide whether to throw

findByEmail(email: string): Promise<SelectUser | null>
- Delegates to usersRepository.findByEmail(email)

create(data: { email?: string; passwordHash?: string; fullName: string; avatarUrl?: string; role?: UserRole; isEmailVerified?: boolean }): Promise<SelectUser>
- Delegates to usersRepository.create(data)
- Does NOT hash passwords — the caller (AuthService) provides an already-hashed string or null for OAuth users

updateProfile(id: string, dto: UpdateProfileDto): Promise<SelectUser>
- If dto.email is provided AND differs from current email: reset isEmailVerified to false
  (email re-verification logic — actual email sending is out of scope for this module)
- Delegates to usersRepository.update(id, { ...dto, updatedAt: new Date() })
- Throws NotFoundException('User not found') if usersRepository.update returns null

deactivate(id: string): Promise<void>
- Delegates to usersRepository.update(id, { isActive: false, updatedAt: new Date() })
- Does NOT hard-delete — preserves booking history

findOrCreateOAuth(provider: 'google' | 'telegram', providerUserId: string, profile: { email?: string; fullName: string; avatarUrl?: string }): Promise<SelectUser>
- Query oauth_accounts where provider = provider AND providerUserId = providerUserId
- If found: return the linked user via usersRepository.findById(oauthAccount.userId)
- If not found and email provided: check if usersRepository.findByEmail(email) exists
  → If yes: insert oauth_accounts row linking to them, return user
- If no match at all: wrap in Drizzle transaction —
    insert user row (role: 'customer', isEmailVerified: true for Google, false for Telegram)
    then insert oauth_accounts row
    return the new user

### users.repository.ts
Thin Drizzle wrapper — all SQL lives here, never in UsersService. Inject DatabaseService.

Methods:
- findById(id: string): Promise<SelectUser | null>
    await this.db.db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0] ?? null

- findByEmail(email: string): Promise<SelectUser | null>
    await this.db.db.select().from(users).where(eq(users.email, email)).limit(1)
    return rows[0] ?? null

- create(data: Partial<InsertUser>): Promise<SelectUser>
    const [user] = await this.db.db.insert(users).values(data).returning()
    return user

- update(id: string, data: Partial<InsertUser>): Promise<SelectUser | null>
    const [user] = await this.db.db.update(users).set(data).where(eq(users.id, id)).returning()
    return user ?? null

- findOAuthAccount(provider: string, providerUserId: string): Promise<SelectOauthAccount | null>
    await this.db.db.select().from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)))
      .limit(1)
    return rows[0] ?? null

- createOAuthAccount(data: Partial<InsertOauthAccount>): Promise<SelectOauthAccount>
    const [account] = await this.db.db.insert(oauthAccounts).values(data).returning()
    return account

- createUserWithOAuth(userData: Partial<InsertUser>, oauthData: Omit<Partial<InsertOauthAccount>, 'userId'>): Promise<SelectUser>
    Wrap in a single Drizzle transaction:
    const [user] = await tx.insert(users).values(userData).returning()
    await tx.insert(oauthAccounts).values({ ...oauthData, userId: user.id })
    return user

### dto/update-profile.dto.ts
```ts
class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsUrl() avatarUrl?: string;
}
```

### dto/user-response.dto.ts
Use class-transformer to exclude sensitive fields from every response automatically:
```ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string | null;
  @Expose() fullName: string;
  @Expose() avatarUrl: string | null;
  @Expose() role: string;
  @Expose() isActive: boolean;
  @Expose() isEmailVerified: boolean;
  @Expose() createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
```

In users.controller.ts, wrap all return values:
  return new UserResponseDto(user);

Enable ClassSerializerInterceptor globally in main.ts (assume it is already configured).

## UsersModule error handling rules
- User not found by ID during updateProfile → NotFoundException('User not found')
- Any unexpected DB error → let it bubble — AllExceptionsFilter catches it and returns 500
- Do NOT throw on deactivate if the user is already inactive — idempotent operation

## Dependency rule
UsersModule must NOT import AuthModule, BookingsModule, or any other feature module.
The dependency arrow is strictly one-directional: AuthModule → UsersModule.

---

### categories.module.ts
- Providers: CategoriesService, CategoriesRepository
- Exports: CategoriesService (imported by ServicesModule for category validation)
- Imports: nothing (DatabaseModule and RedisModule are @Global())
- NOT @Global() — only ServicesModule needs to import it

### categories.controller.ts
Base path: /categories
No auth guard — all endpoints are fully public. Guests browsing the service listing page need categories before logging in.

Endpoints:

`GET /categories`
- Calls categoriesService.findAll()
- Returns CategoryResponseDto[]

`GET /categories/:slug`
- Calls categoriesService.findBySlug(slug)
- Throws NotFoundException('Category not found') if null
- Returns CategoryResponseDto

### categories.service.ts
Inject DatabaseService (via CategoriesRepository) and RedisService.
Use cache-aside pattern: Redis key `categories:all` (TTL 3600s) for the list, `categories:slug:{slug}` (TTL 3600s) for individual lookups.

Methods:

`findAll(): Promise<SelectCategory[]>`
- Check Redis for key `categories:all` → if hit, JSON.parse and return
- On miss: call categoriesRepository.findAll(), JSON.stringify and store in Redis with 3600s TTL, return rows

`findBySlug(slug: string): Promise<SelectCategory | null>`
- Check Redis for key `categories:slug:{slug}` → if hit, JSON.parse and return
- On miss: call categoriesRepository.findBySlug(slug)
- If found: store in Redis with 3600s TTL
- Return row or null

`invalidateCache(): Promise<void>`
- Delete Redis keys `categories:all` and all `categories:slug:*` keys
- Called by admin operations (future scope) when a category is created or updated

### categories.repository.ts
Thin Drizzle wrapper. Inject DatabaseService.

Methods:
- `findAll(): Promise<SelectCategory[]>`
    await this.db.db.select().from(categories).orderBy(asc(categories.sortOrder))

- `findBySlug(slug: string): Promise<SelectCategory | null>`
    const rows = await this.db.db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
    return rows[0] ?? null

Import `asc` from `'drizzle-orm'` for the orderBy clause.

### CategoryResponseDto (define inline in categories.controller.ts or a dto file)
```ts
@Exclude()
export class CategoryResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string;
  @Expose() colorHex: string | null;
  @Expose() sortOrder: number;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
```
Note: `description` is intentionally NOT exposed — it is an admin-facing internal note.

### CategoriesModule error handling rules
- Category not found by slug → NotFoundException('Category not found')
- Any unexpected DB error → let it bubble → AllExceptionsFilter returns 500
- Redis failures should be caught and silently fall through to the DB query (never let a cache miss crash the request)

---

## Detailed requirements — ServicesModule

### services.module.ts
- Providers: ServicesService, AvailabilityService, ServicesRepository
- Exports: ServicesService (imported by BookingsModule in future)
- Imports: CategoriesModule (to inject CategoriesService for categoryId validation)
- NOT @Global()

### services.controller.ts
Base path: /services
All endpoints use @UseGuards(OptionalAuthGuard) — guests can browse, but req.user is populated when a token is present.

Endpoints:

`GET /services`
- @Query() query: ServiceListQueryDto
- Calls servicesService.findAll(query)
- Returns { data: ServiceSummaryResponseDto[], meta: { total, page, perPage, lastPage } }

`GET /services/:id`
- Calls servicesService.findById(id)
- Throws NotFoundException('Service not found') if null or isActive false
- Returns ServiceDetailResponseDto

`GET /services/:id/availability`
- @Query('date') date: string — required, format YYYY-MM-DD, validate with @IsDateString()
- Calls servicesService.getAvailability(id, date)
- Returns { date: string, slots: { time: string; available: boolean }[] }

### ServiceListQueryDto (src/services/dto/service-list-query.dto.ts)
```ts
export class ServiceListQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['price_asc', 'price_desc', 'duration_asc', 'soonest']) sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) perPage?: number;
}
```
Default page = 1, default perPage = 12.

### ServiceSummaryResponseDto (define inline in services.controller.ts)
Fields to expose: id, name, priceCents, durationMinutes, coverImageUrl, cancellationPolicy,
business: { id, name, logoUrl }, category: { id, name, slug, colorHex }, nextAvailableSlot (ISO string or null).

### ServiceDetailResponseDto (define inline in services.controller.ts)
All fields from ServiceSummaryResponseDto plus: description, business.address, business.phone.

### services.service.ts
Inject ServicesRepository, AvailabilityService, CategoriesService, RedisService.

Methods:

`findAll(query: ServiceListQueryDto): Promise<{ data: any[]; meta: any }>`
- Delegates to servicesRepository.findAll(query)
- For each service in the result, call getNextAvailableSlot(service.id) if query.sort === 'soonest', otherwise set nextAvailableSlot: null
- Return paginated result with meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) }

`findById(id: string): Promise<SelectService & { business: SelectBusiness; category: SelectCategory | null } | null>`
- Delegates to servicesRepository.findWithRelations(id)
- Returns null if not found or isActive is false

`getAvailability(serviceId: string, date: string): Promise<{ time: string; available: boolean }[]>`
- Load service, throw NotFoundException if not found or inactive
- In parallel via Promise.all:
    1. servicesRepository.findRulesByDayOfWeek(serviceId, getDayOfWeek(date))
    2. servicesRepository.findBlocksByDate(serviceId, date)
    3. servicesRepository.findBookedSlots(serviceId, date)
- Pass all three to availabilityService.computeSlots(rules, blocks, bookedSlots, date)
- For each slot where available is true, check Redis: key = `slot_lock:{serviceId}:{date}:{slot.time}` — if key exists, mark available: false
- Return the final slot array

`getNextAvailableSlot(serviceId: string): Promise<string | null>`
- Iterate from today forward up to 14 days
- For each date call getAvailability(serviceId, date)
- Return the ISO datetime string of the first slot where available is true
- Return null if no availability found in the 14-day window

Helper `getDayOfWeek(date: string): string`
- Parse YYYY-MM-DD, return lowercase day name e.g. 'monday'
- Use: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

### availability.service.ts
Pure logic service — no database or Redis calls. Takes data already loaded by ServicesService.

`computeSlots(rules: SelectAvailabilityRule[], blocks: SelectAvailabilityBlock[], bookedSlots: { bookingTime: string }[], date: string): { time: string; available: boolean }[]`

Step 1 — generateSlots(rules, date):
- Filter rules where isActive is true
- For each rule, step from startTime to endTime in increments of slotDurationMinutes
- Each step produces { time: 'HH:mm', available: true }
- Time comparison: parse 'HH:mm:ss' strings into total minutes for arithmetic
- Return deduplicated, sorted slot list

Step 2 — subtractBlocks(slots, blocks):
- For each block:
  - If startTime and endTime are null → remove all slots on this date (whole day block)
  - Otherwise → remove slots whose time falls within [block.startTime, block.endTime)
- Return filtered slots (slots are REMOVED not just marked unavailable)

Step 3 — subtractBookings(slots, bookedSlots):
- For each booked slot, find the matching slot by time and mark available: false
- Do NOT remove the slot — the frontend renders it greyed out

Return the final slots array.

Note: Redis slot lock subtraction happens in ServicesService.getAvailability() AFTER calling computeSlots(), not inside AvailabilityService. This keeps AvailabilityService pure and unit-testable.

### services.repository.ts
Thin Drizzle wrapper. Inject DatabaseService.

Methods:

`findAll(query: ServiceListQueryDto): Promise<{ rows: any[]; total: number }>`
- Build dynamic where conditions:
  - isActive = true (always)
  - If query.q: ilike(services.name, `%${query.q}%`) OR ilike(businesses.name, `%${query.q}%`) via join
  - If query.categoryId: eq(services.categoryId, query.categoryId)
- Join services → businesses → categories (left join for category)
- Count total matching rows (separate count query using same where conditions)
- Apply pagination: .limit(perPage).offset((page-1)*perPage)
- Apply sort: price_asc → asc(services.priceCents), price_desc → desc(services.priceCents), duration_asc → asc(services.durationMinutes), default → asc(services.createdAt)
- Return { rows, total }

`findWithRelations(id: string): Promise<any | null>`
- Select service joined with business and category where services.id = id
- Return combined object or null if not found

`findRulesByDayOfWeek(serviceId: string, dayOfWeek: string): Promise<SelectAvailabilityRule[]>`
- Select from availabilityRules where serviceId = serviceId AND dayOfWeek = dayOfWeek AND isActive = true

`findBlocksByDate(serviceId: string, date: string): Promise<SelectAvailabilityBlock[]>`
- Select from availabilityBlocks where serviceId = serviceId AND blockDate = date

`findBookedSlots(serviceId: string, date: string): Promise<{ bookingTime: string }[]>`
- Select bookingTime from bookings where serviceId = serviceId AND bookingDate = date AND status IN ('pending', 'confirmed')
- NOTE: bookings table does not exist yet. Return empty array [] until BookingsModule is implemented.
  Add this comment in the code: // TODO: implement when BookingsModule adds the bookings table

### ServicesModule error handling rules
- Service not found or inactive → NotFoundException('Service not found')
- Invalid date format in availability query → BadRequestException (handled by ValidationPipe via @IsDateString())
- Any unexpected DB error → let it bubble → AllExceptionsFilter returns 500
- Redis failures in slot lock check → catch silently and treat slot as available (never crash availability endpoint)

---

## Shared imports available from infrastructure

- DatabaseService from 'src/database/database.service' — use this.db.db for Drizzle queries
- All schema tables and Drizzle types from 'src/database/schema':
  users, oauthAccounts, refreshTokens, files, categories, businesses, services,
  availabilityRules, availabilityBlocks, slotLocks
  InsertUser, SelectUser, InsertOauthAccount, SelectOauthAccount, InsertFile, SelectFile,
  InsertCategory, SelectCategory, InsertBusiness, SelectBusiness,
  InsertService, SelectService, InsertAvailabilityRule, SelectAvailabilityRule,
  InsertAvailabilityBlock, SelectAvailabilityBlock, InsertSlotLock, SelectSlotLock
- RedisService from 'src/redis/redis.service' — client: Redis (ioredis), use this.redisService.client
- JwtAuthGuard from 'src/common/guards/jwt-auth.guard'
- OptionalAuthGuard from 'src/common/guards/optional-auth.guard'
- CurrentUser decorator from 'src/common/decorators/current-user.decorator'

## Drizzle query patterns to use

Select:
  await this.db.db.select().from(users).where(eq(users.email, email)).limit(1)

Insert:
  const [user] = await this.db.db.insert(users).values({ ... }).returning()

Update:
  const [user] = await this.db.db.update(users).set({ ...data }).where(eq(users.id, id)).returning()

Transaction:
  await this.db.db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ ... }).returning()
    await tx.insert(oauthAccounts).values({ userId: user.id, ... })
  })

Delete:
  await this.db.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))

Multiple conditions:
  .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)))

In array:
  .where(inArray(files.id, ids))

OrderBy:
  .orderBy(asc(categories.sortOrder))
  .orderBy(desc(services.priceCents))

Import helpers from 'drizzle-orm': eq, and, inArray, asc, desc, ilike, or

Generate all 34 files now. Output each file preceded by a line with its path like:
// FILE: src/auth/auth.module.ts
Then the complete file content. No other text.
```

---

## How to use this in a Bolt artifact

1. Create a React artifact
2. On load, call the Anthropic API with the system prompt and build prompt above
3. Parse the response — split on `// FILE:` lines to extract each file separately
4. Render a file explorer sidebar listing all 34 files, grouped into five folders: `auth/`, `users/`, `files/`, `categories/`, and `services/`
5. Show each file's content in a syntax-highlighted code panel
6. Add a chat input at the bottom so the user can ask follow-up questions — each follow-up calls the API again with the same system prompt and the conversation history

## Follow-up prompt examples to wire into the UI

- "Add an email verification flow to AuthService — send a token on register, expose POST /auth/verify-email"
- "Add a PATCH /auth/me endpoint to AuthController for updating fullName and avatarUrl"
- "Explain how refreshTokens rotation prevents token theft"
- "Add unit test stubs for AuthService and UsersService using Jest and @nestjs/testing"
- "Show me the SQL migration that drizzle-kit would generate for all new schema tables"
- "Add a GET /users/me/oauth-accounts endpoint to list linked OAuth providers"
- "Explain why UsersModule must not import AuthModule"
- "Show me how to wire FilesService into ServicesModule to attach images to a service on create"
- "Add seed data logic for the categories table with 5 example categories"
- "Explain how the availability computation pipeline handles a full-day block vs a time-range block"
- "Add a GET /services/:id/next-slot endpoint that returns the next available datetime as a single ISO string"
- "Show me how BookingsModule will call ServicesService.getAvailability() before confirming a booking"
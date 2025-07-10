# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Express.js application with Node.js and TypeScript.

## Project Overview

{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles

- **Middleware Composition**: Build with small, focused middleware
- **Error Handling**: Centralized error handling middleware
- **Async/Await**: Use modern async patterns
- **Type Safety**: Leverage TypeScript throughout

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 300 lines**
- **Route handlers should be under 50 lines**
- **Middleware functions should have single responsibility**
- **Extract business logic into service layer**

## 🚀 Express & TypeScript Best Practices

### TypeScript Integration (MANDATORY)

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

interface User {
  id: string;
  email: string;
  name: string;
}

// Typed request interface
interface TypedRequest<T = {}> extends Request {
  body: T;
}

// Route handler with types
export const createUser = async (
  req: TypedRequest<{ email: string; password: string }>,
  res: Response<{ user: User } | { error: string }>,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const user = await userService.create(req.body);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

## 🛡️ Input Validation

### Express Validator Pattern

```typescript
import { body, param, query } from 'express-validator';

export const userValidation = {
  create: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],

  update: [
    param('id').isUUID().withMessage('Valid user ID required'),
    body('name').optional().trim().notEmpty(),
  ],
};

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 80% code coverage**
- **MUST use Jest and Supertest**
- **MUST test all endpoints**
- **MUST mock external dependencies**

```typescript
import request from 'supertest';
import { app } from '../app';
import { userService } from '../services/userService';

jest.mock('../services/userService');

describe('POST /users', () => {
  it('creates a new user', async () => {
    const mockUser = { id: '123', email: 'test@example.com', name: 'Test' };
    (userService.create as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual(mockUser);
  });
});
```

## 🔄 Async Error Handling

### Async Handler Wrapper

```typescript
// utils/asyncHandler.ts
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Usage in routes
router.post('/users', userValidation.create, validate, asyncHandler(createUser));
```

### Global Error Handler

```typescript
// middleware/errorHandler.ts
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(err.stack);

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

## 🔐 Security Requirements

### Security Middleware Setup

```typescript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);

// Input sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## 💅 Code Style & Quality

### ESLint Configuration

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
```

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  }
}
```

## 🗄️ Database Patterns

### Query Builder/ORM Usage

```typescript
// Using Prisma example
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async create(data: CreateUserDto): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: await hashPassword(data.password),
        name: data.name,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use TypeScript** - No plain JavaScript
2. **VALIDATE all inputs** - Use express-validator
3. **HANDLE async errors** - Use error handling middleware
4. **MINIMUM 80% test coverage** - NO EXCEPTIONS
5. **NEVER expose sensitive data** - Filter responses
6. **USE environment variables** - No hardcoded config

## 📋 Pre-commit Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests passing with 80%+ coverage
- [ ] ESLint passes without warnings
- [ ] No console.log statements (except error handling)
- [ ] All endpoints have validation
- [ ] Error handling is comprehensive
- [ ] Security middleware configured
- [ ] API documentation updated

## API Documentation

### OpenAPI/Swagger Setup

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '{{projectName}} API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### API Development Flow

1. Define route and validation
2. Implement service layer logic
3. Add error handling
4. Write comprehensive tests
5. Update API documentation
6. Test with actual HTTP client

{{#if prpConfig}}

### PRP Workflow

- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for additional context when needed
  {{/if}}

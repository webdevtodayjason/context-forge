# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this FastAPI application with Python.

## Project Overview

{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles

- **Dependency Injection**: Use FastAPI's dependency system effectively
- **Type Safety**: Leverage Python type hints and Pydantic models
- **Async First**: Use async/await for I/O operations
- **Fail Fast**: Validate inputs early with Pydantic

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 500 lines of code**
- **Functions should be under 50 lines**
- **Classes should have a single responsibility**
- **Use modules to organize related functionality**

## 🚀 FastAPI & Python Best Practices

### Type Hints (MANDATORY)

- **MUST use type hints** for all function parameters and returns
- **MUST use Pydantic models** for request/response validation
- **MUST use Python 3.10+** type features

```python
from typing import List, Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

async def create_user(user: UserCreate) -> dict[str, Any]:
    # Implementation
    pass
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

## 🛡️ Data Validation with Pydantic

### Validation Rules

- **MUST validate ALL external data**: Request bodies, query params, headers
- **MUST use Pydantic v2** syntax
- **MUST fail fast**: Let Pydantic handle validation errors

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class UserModel(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    is_active: bool = True

    @field_validator('email')
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        # Additional validation if needed
        return v.lower()

# Settings with environment validation
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "{{projectName}}"
    database_url: str
    secret_key: str

    class Config:
        env_file = ".env"
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 80% code coverage**
- **MUST use pytest** for testing
- **MUST test all endpoints**
- **MUST use test fixtures** for database/dependencies

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/users/",
            json={"email": "test@example.com", "password": "secret"}
        )
    assert response.status_code == 201
```

## 🔄 Async Patterns

### Best Practices

- **Use async/await** for all I/O operations
- **Use asyncio.gather()** for concurrent operations
- **Avoid blocking operations** in async functions

```python
import asyncio
from typing import List

async def fetch_user(user_id: int) -> User:
    # Async database query
    pass

async def fetch_multiple_users(user_ids: List[int]) -> List[User]:
    # Concurrent fetching
    users = await asyncio.gather(
        *[fetch_user(user_id) for user_id in user_ids]
    )
    return users
```

## 🔐 Security Requirements

- **MUST hash passwords** with bcrypt
- **MUST use JWT** for authentication
- **MUST validate all inputs** with Pydantic
- **MUST use CORS middleware** appropriately
- **MUST implement rate limiting**

```python
from passlib.context import CryptContext
from jose import JWTError, jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

## 💅 Code Style & Quality

### Tools and Configuration

- **Black** for code formatting
- **Ruff** for linting
- **mypy** for type checking
- **isort** for import sorting

```toml
# pyproject.toml
[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W", "UP"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "uvicorn app.main:app --reload",
    "test": "pytest",
    "test:cov": "pytest --cov=app --cov-report=html",
    "lint": "ruff check . --fix",
    "format": "black .",
    "type-check": "mypy app"
  }
}
```

## ⚠️ CRITICAL GUIDELINES

1. **ENFORCE type hints** - ALL functions must be typed
2. **VALIDATE with Pydantic** - ALL external data
3. **MINIMUM 80% test coverage** - NO EXCEPTIONS
4. **MAXIMUM 500 lines per file** - Split if larger
5. **MUST handle errors properly** - Use HTTPException
6. **NEVER store secrets in code** - Use environment variables

## 📋 Pre-commit Checklist

- [ ] All tests passing
- [ ] Type checking passes (mypy)
- [ ] Linting passes (ruff)
- [ ] Code formatted (black)
- [ ] 80%+ test coverage
- [ ] No hardcoded secrets
- [ ] API documentation updated

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### Task Execution Protocol

1. Read task from Implementation.md
2. Check relevant documentation
3. Implement following existing patterns
4. Write tests for new functionality
5. Mark task complete only when fully working

### Error Handling Pattern

```python
from fastapi import HTTPException, status

async def get_user(user_id: int) -> User:
    user = await db.fetch_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return user
```

{{#if prpConfig}}

### PRP Workflow

- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for additional context when needed
  {{/if}}

# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Angular application with TypeScript and RxJS.

## Project Overview

{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles

- **Component-Based Architecture**: Build with reusable, testable components
- **Dependency Injection**: Use Angular's DI system effectively
- **Reactive Programming**: Leverage RxJS for async operations
- **Strong Typing**: TypeScript everywhere, no exceptions

## 🧱 Code Structure & Modularity

### File and Component Limits

- **Never create a file longer than 300 lines**
- **Components should be under 200 lines**
- **Services should be under 150 lines**
- **Use feature modules to organize code**

## 🚀 Angular & TypeScript Best Practices

### Component Structure (MANDATORY)

- **MUST use standalone components** (Angular 15+)
- **MUST follow Angular style guide**
- **MUST use OnPush change detection** where possible
- **NEVER use `any` type**

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <button (click)="onEdit()">Edit</button>
    </div>
  `,
  styleUrls: ['./user-card.component.scss'],
})
export class UserCardComponent {
  @Input({ required: true }) user!: User;
  @Output() edit = new EventEmitter<User>();

  onEdit(): void {
    this.edit.emit(this.user);
  }
}
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Angular Structure

```
src/
├── app/
│   ├── core/                # Singleton services
│   │   ├── services/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── shared/              # Shared modules
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/            # Feature modules
│   │   ├── users/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── users.routes.ts
│   │   └── products/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
├── environments/
└── styles/
```

## 🎯 Services & Dependency Injection

### Service Pattern with RxJS

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map((users) => {
        this.usersSubject.next(users);
        return users;
      }),
      catchError((error) => {
        console.error('Failed to fetch users:', error);
        return of([]);
      })
    );
  }

  getUser(id: number): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }

  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
}
```

## 🛡️ Form Handling & Validation

### Reactive Forms with Strong Typing

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

interface UserForm {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" />
      <div *ngIf="email?.invalid && email?.touched">Email is required and must be valid</div>

      <input formControlName="password" type="password" />
      <div *ngIf="password?.invalid && password?.touched">
        Password must be at least 8 characters
      </div>

      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  form!: FormGroup<UserForm>;

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        email: this.fb.control('', {
          validators: [Validators.required, Validators.email],
          nonNullable: true,
        }),
        password: this.fb.control('', {
          validators: [Validators.required, Validators.minLength(8)],
          nonNullable: true,
        }),
        confirmPassword: this.fb.control('', {
          validators: [Validators.required],
          nonNullable: true,
        }),
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 85% code coverage** for Angular projects
- **MUST use Angular Testing Library**
- **MUST test components, services, and guards**
- **MUST use TestBed for integration tests**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    component.user = { id: 1, name: 'Test User', email: 'test@example.com' };
    fixture.detectChanges();
  });

  it('should display user information', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@example.com');
  });

  it('should emit edit event when button clicked', () => {
    spyOn(component.edit, 'emit');

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(component.edit.emit).toHaveBeenCalledWith(component.user);
  });
});
```

## 🔄 RxJS Patterns

### Best Practices for Observables

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search',
  template: ` <input (input)="search($event)" placeholder="Search..." /> `,
})
export class SearchComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private userService: UserService) {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm);
      });
  }

  search(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  private performSearch(term: string): void {
    this.userService
      .searchUsers(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        // Handle search results
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## 💅 Code Style & Quality

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@angular-eslint/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      {
        type: 'attribute',
        prefix: 'app',
        style: 'camelCase',
      },
    ],
    '@angular-eslint/component-selector': [
      'error',
      {
        type: 'element',
        prefix: 'app',
        style: 'kebab-case',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
  },
};
```

## 📋 Development Commands

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test --code-coverage",
    "test:ci": "ng test --no-watch --code-coverage --browsers=ChromeHeadless",
    "lint": "ng lint",
    "e2e": "ng e2e"
  }
}
```

## 🔐 Security Requirements

### HTTP Interceptors for Security

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(cloned);
  }

  return next(req);
};

// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use standalone components** - Module-based is legacy
2. **ALWAYS use OnPush change detection** - Better performance
3. **MINIMUM 85% test coverage** - Angular apps need thorough testing
4. **NEVER subscribe in components** - Use async pipe
5. **ALWAYS unsubscribe** - Memory leaks are unacceptable
6. **USE Angular CLI** - For generating components/services

## 📋 Pre-commit Checklist

- [ ] All tests passing with 85%+ coverage
- [ ] Angular linting passes
- [ ] No memory leaks (proper unsubscribe)
- [ ] OnPush change detection where possible
- [ ] Proper error handling in services
- [ ] Loading states implemented
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] No console.log statements
- [ ] Lazy loading for feature modules

## Guards & Interceptors

### Route Guards

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
      return true;
    })
  );
};
```

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Angular version compatibility
- Review Angular style guide

### Angular Development Flow

1. Generate component/service with CLI
2. Implement with proper TypeScript types
3. Add OnPush change detection
4. Handle loading and error states
5. Write comprehensive tests
6. Check for memory leaks

{{#if prpConfig}}

### PRP Workflow

- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Angular-specific documentation
  {{/if}}

# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Django application with Python.

## Project Overview
{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles
- **Fat Models, Thin Views**: Business logic in models, not views
- **DRY (Don't Repeat Yourself)**: Use Django's built-in features
- **Convention over Configuration**: Follow Django patterns
- **Explicit is Better than Implicit**: Clear, readable code

## 🧱 Code Structure & Modularity

### File and Function Limits
- **Never create a file longer than 500 lines of code**
- **View functions/classes should be under 100 lines**
- **Model methods should be under 50 lines**
- **Use managers for complex queries**

## 🚀 Django & Python Best Practices

### Type Hints (MANDATORY)
- **MUST use type hints** for all functions
- **MUST use Django-stubs** for type checking
- **MUST validate with mypy**

```python
from typing import Optional, List
from django.db import models
from django.http import HttpRequest, HttpResponse
from django.views import View

class Article(models.Model):
    title: models.CharField = models.CharField(max_length=200)
    content: models.TextField = models.TextField()
    published: models.BooleanField = models.BooleanField(default=False)
    
    def get_word_count(self) -> int:
        return len(self.content.split())
    
    @classmethod
    def get_published(cls) -> models.QuerySet['Article']:
        return cls.objects.filter(published=True)

def article_detail(request: HttpRequest, pk: int) -> HttpResponse:
    article = get_object_or_404(Article, pk=pk)
    return render(request, 'articles/detail.html', {'article': article})
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Django Structure
```
myproject/
├── apps/                  # Django apps
│   ├── users/            # User management
│   ├── core/             # Core functionality
│   └── api/              # API endpoints
├── config/               # Project configuration
│   ├── settings/         # Settings modules
│   │   ├── base.py      # Base settings
│   │   ├── dev.py       # Development
│   │   └── prod.py      # Production
│   ├── urls.py          # URL configuration
│   └── wsgi.py          # WSGI config
├── static/              # Static files
├── templates/           # HTML templates
├── tests/               # Test files
└── requirements/        # Dependencies
    ├── base.txt
    ├── dev.txt
    └── prod.txt
```

## 🛡️ Model Design & Validation

### Model Best Practices
```python
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from typing import Optional

class Product(models.Model):
    """Product model with proper validation and methods."""
    
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, max_length=200)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self) -> str:
        return self.name
    
    def save(self, *args, **kwargs) -> None:
        # Custom validation
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

## 🧪 Testing Strategy

### Requirements
- **MINIMUM 85% code coverage** for Django projects
- **MUST use pytest-django**
- **MUST test all views, models, and forms**
- **MUST use fixtures and factories**

```python
import pytest
from django.test import Client
from django.urls import reverse
from myapp.models import Article

@pytest.mark.django_db
class TestArticleViews:
    def test_article_list(self, client: Client):
        # Create test data
        Article.objects.create(
            title="Test Article",
            content="Test content",
            published=True
        )
        
        response = client.get(reverse('articles:list'))
        assert response.status_code == 200
        assert "Test Article" in response.content.decode()
    
    def test_article_detail(self, client: Client, article_factory):
        article = article_factory(published=True)
        response = client.get(
            reverse('articles:detail', kwargs={'pk': article.pk})
        )
        assert response.status_code == 200
```

## 🔄 Views & URL Patterns

### Class-Based Views (Preferred)
```python
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from typing import Any, Dict

class ArticleListView(ListView):
    model = Article
    template_name = 'articles/list.html'
    context_object_name = 'articles'
    paginate_by = 20
    
    def get_queryset(self):
        return Article.objects.filter(published=True)
    
    def get_context_data(self, **kwargs) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context['total_count'] = self.get_queryset().count()
        return context

class ArticleCreateView(LoginRequiredMixin, CreateView):
    model = Article
    fields = ['title', 'content']
    success_url = reverse_lazy('articles:list')
    
    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
```

## 🔐 Security Requirements

### Django Security Checklist
```python
# settings/production.py
SECRET_KEY = env('SECRET_KEY')  # Never hardcode
DEBUG = False
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Security middleware
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# CSRF protection
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS')

# User model security
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 12}
    },
]
```

## 💅 Code Style & Quality

### Tools Configuration
```toml
# pyproject.toml
[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W", "DJ"]

[tool.mypy]
plugins = ["mypy_django_plugin.main"]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.test"
python_files = ["test_*.py", "*_test.py"]
```

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "python manage.py runserver",
    "migrate": "python manage.py migrate",
    "makemigrations": "python manage.py makemigrations",
    "test": "pytest",
    "test:cov": "pytest --cov=apps --cov-report=html",
    "lint": "ruff check . --fix",
    "format": "black .",
    "type-check": "mypy .",
    "check": "python manage.py check --deploy"
  }
}
```

## 🗄️ Database & ORM

### Query Optimization
```python
# Avoid N+1 queries
articles = Article.objects.select_related('author').prefetch_related('tags')

# Use only() for specific fields
articles = Article.objects.only('title', 'slug', 'published_at')

# Bulk operations
Article.objects.bulk_create([
    Article(title=f"Article {i}") for i in range(100)
])

# Custom managers
class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(published=True)

class Article(models.Model):
    # ... fields ...
    objects = models.Manager()
    published = PublishedManager()
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use Django's built-in features** - Don't reinvent
2. **VALIDATE at model level** - Not just forms
3. **MINIMUM 85% test coverage** - Django apps need thorough testing
4. **USE Django admin** - Customize don't rebuild
5. **FOLLOW Django conventions** - app structure, naming
6. **NEVER store secrets in code** - Use environment variables

## 📋 Pre-commit Checklist

- [ ] All tests passing with 85%+ coverage
- [ ] Django check --deploy passes
- [ ] Migrations are optimized
- [ ] No security warnings
- [ ] Type checking passes (mypy)
- [ ] Linting passes (ruff)
- [ ] No raw SQL without parameterization
- [ ] Admin is properly configured
- [ ] Signals are documented if used

## Django-Specific Patterns

### Custom Middleware
```python
from django.utils.deprecation import MiddlewareMixin
from typing import Optional

class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        # Log request details
        return None
    
    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        # Log response details
        return response
```

### Form Handling
```python
from django import forms
from django.core.exceptions import ValidationError

class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ['title', 'content', 'tags']
    
    def clean_title(self) -> str:
        title = self.cleaned_data['title']
        if Article.objects.filter(title=title).exists():
            raise ValidationError("Article with this title already exists")
        return title
```

## Workflow Rules

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Django version compatibility
- Review existing patterns in the codebase

### Django Development Flow
1. Design models with proper validation
2. Create and optimize migrations
3. Build views following Django patterns
4. Write comprehensive tests
5. Configure admin interface
6. Document API if applicable

{{#if prpConfig}}
### PRP Workflow
- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Django-specific documentation
{{/if}}
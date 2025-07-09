# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Spring Boot application with Java.

## Project Overview
{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles
- **Dependency Injection**: Use Spring's IoC container effectively
- **Convention over Configuration**: Follow Spring Boot conventions
- **Layered Architecture**: Separate concerns (Controller, Service, Repository)
- **SOLID Principles**: Single responsibility, open/closed, etc.

## 🧱 Code Structure & Modularity

### File and Class Limits
- **Never create a file longer than 300 lines**
- **Classes should have single responsibility**
- **Methods should be under 30 lines**
- **Use proper package structure**

## 🚀 Spring Boot & Java Best Practices

### Annotations and Structure (MANDATORY)
- **MUST use proper Spring annotations**
- **MUST follow REST conventions**
- **MUST use constructor injection**
- **MUST validate inputs**

```java
package com.{{projectName}}.controller;

import com.{{projectName}}.dto.UserCreateDto;
import com.{{projectName}}.dto.UserResponseDto;
import com.{{projectName}}.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getAllUsers(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto createUser(@Valid @RequestBody UserCreateDto userDto) {
        return userService.createUser(userDto);
    }
}
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Spring Boot Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/{{projectName}}/
│   │       ├── config/         # Configuration classes
│   │       ├── controller/     # REST controllers
│   │       ├── service/        # Business logic
│   │       ├── repository/     # Data access
│   │       ├── entity/         # JPA entities
│   │       ├── dto/            # Data transfer objects
│   │       ├── mapper/         # Entity-DTO mappers
│   │       ├── exception/      # Custom exceptions
│   │       ├── security/       # Security config
│   │       └── Application.java
│   └── resources/
│       ├── application.yml     # Configuration
│       ├── db/migration/       # Flyway migrations
│       └── static/             # Static resources
└── test/
    └── java/                   # Test files
```

## 🛡️ Data Validation

### Bean Validation with DTOs
```java
package com.{{projectName}}.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserCreateDto {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", 
             message = "Password must contain at least one uppercase, lowercase, and digit")
    private String password;
    
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;
    
    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 120, message = "Age must be less than 120")
    private Integer age;
}
```

## 🧪 Testing Strategy

### Requirements
- **MINIMUM 80% code coverage**
- **MUST use JUnit 5 and Mockito**
- **MUST test all layers**
- **MUST use @SpringBootTest for integration tests**

```java
package com.{{projectName}}.controller;

import com.{{projectName}}.dto.UserCreateDto;
import com.{{projectName}}.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void createUser_ValidInput_ReturnsCreated() throws Exception {
        // Given
        UserCreateDto createDto = new UserCreateDto();
        createDto.setEmail("test@example.com");
        createDto.setPassword("Password123");
        createDto.setName("Test User");

        UserResponseDto responseDto = new UserResponseDto();
        responseDto.setId(1L);
        responseDto.setEmail("test@example.com");

        when(userService.createUser(any(UserCreateDto.class))).thenReturn(responseDto);

        // When & Then
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
```

## 🔄 Service Layer Pattern

### Business Logic Implementation
```java
package com.{{projectName}}.service;

import com.{{projectName}}.dto.UserCreateDto;
import com.{{projectName}}.dto.UserResponseDto;
import com.{{projectName}}.entity.User;
import com.{{projectName}}.exception.ResourceNotFoundException;
import com.{{projectName}}.mapper.UserMapper;
import com.{{projectName}}.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponseDto createUser(UserCreateDto createDto) {
        log.debug("Creating new user with email: {}", createDto.getEmail());
        
        if (userRepository.existsByEmail(createDto.getEmail())) {
            throw new DuplicateResourceException("User with email already exists");
        }

        User user = userMapper.toEntity(createDto);
        user.setPassword(passwordEncoder.encode(createDto.getPassword()));
        
        User savedUser = userRepository.save(user);
        log.info("Created user with id: {}", savedUser.getId());
        
        return userMapper.toDto(savedUser);
    }

    public Optional<UserResponseDto> getUserById(Long id) {
        return userRepository.findById(id)
                .map(userMapper::toDto);
    }

    public Page<UserResponseDto> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size))
                .map(userMapper::toDto);
    }
}
```

## 🔐 Security Configuration

### Spring Security Setup
```java
package com.{{projectName}}.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## 💅 Code Style & Quality

### Checkstyle Configuration
```xml
<!-- checkstyle.xml -->
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
    <module name="TreeWalker">
        <module name="FileLength">
            <property name="max" value="300"/>
        </module>
        <module name="MethodLength">
            <property name="max" value="30"/>
        </module>
        <module name="ParameterNumber">
            <property name="max" value="5"/>
        </module>
    </module>
</module>
```

## 📋 Development Commands

```xml
<!-- Maven commands -->
<project>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>**/config/**</exclude>
                        <exclude>**/entity/**</exclude>
                        <exclude>**/dto/**</exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

```bash
# Development commands
mvn spring-boot:run              # Run application
mvn test                         # Run tests
mvn verify                       # Run tests with coverage
mvn checkstyle:check            # Check code style
mvn spotbugs:check              # Static analysis
```

## 🗄️ Database & JPA

### Entity and Repository Pattern
```java
package com.{{projectName}}.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;
}

// Repository with custom queries
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.role = :role")
    Page<User> findByRole(@Param("role") UserRole role, Pageable pageable);
    
    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :lastLoginAt WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id, @Param("lastLoginAt") LocalDateTime lastLoginAt);
}
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use constructor injection** - Not field injection
2. **VALIDATE all inputs** - Use Bean Validation
3. **MINIMUM 80% test coverage** - Exclude DTOs and configs
4. **USE transactions properly** - @Transactional on service layer
5. **HANDLE exceptions globally** - Use @ControllerAdvice
6. **NEVER expose entities** - Always use DTOs

## 📋 Pre-commit Checklist

- [ ] All tests passing with 80%+ coverage
- [ ] Checkstyle passes
- [ ] SpotBugs analysis clean
- [ ] No hardcoded values (use application.yml)
- [ ] Proper exception handling
- [ ] Database migrations created
- [ ] API documentation updated (OpenAPI)
- [ ] Security considerations addressed

## Exception Handling

### Global Exception Handler
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.builder()
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                    FieldError::getField,
                    FieldError::getDefaultMessage
                ));
        
        ErrorResponse error = ErrorResponse.builder()
                .message("Validation failed")
                .details(errors)
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
```

## Workflow Rules

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Spring Boot version compatibility
- Review existing patterns in codebase

### Spring Boot Development Flow
1. Define entity with proper JPA annotations
2. Create repository interface
3. Implement service layer with business logic
4. Create DTOs and mappers
5. Build REST controller
6. Write comprehensive tests for all layers
7. Add database migrations

{{#if prpConfig}}
### PRP Workflow
- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Spring Boot documentation
{{/if}}
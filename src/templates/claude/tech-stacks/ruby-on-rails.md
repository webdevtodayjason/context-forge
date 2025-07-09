# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Ruby on Rails application.

## Project Overview
{{description}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles
- **Convention over Configuration**: Follow Rails conventions
- **DRY (Don't Repeat Yourself)**: Use Rails helpers and concerns
- **Fat Models, Skinny Controllers**: Business logic in models
- **RESTful Design**: Use Rails resource routing

## 🧱 Code Structure & Modularity

### File and Method Limits
- **Never create a file longer than 300 lines**
- **Methods should be under 20 lines**
- **Classes should have single responsibility**
- **Use concerns for shared functionality**

## 🚀 Rails & Ruby Best Practices

### Model Structure (MANDATORY)
- **MUST use strong parameters**
- **MUST validate at model level**
- **MUST use scopes for queries**
- **MUST follow Rails naming conventions**

```ruby
# app/models/user.rb
class User < ApplicationRecord
  # Constants
  MIN_PASSWORD_LENGTH = 8
  
  # Associations
  has_many :posts, dependent: :destroy
  has_many :comments, through: :posts
  has_one :profile, dependent: :destroy
  
  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false }, 
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true, length: { maximum: 100 }
  validates :password, length: { minimum: MIN_PASSWORD_LENGTH }, if: :password_required?
  
  # Callbacks
  before_save :downcase_email
  after_create :create_default_profile
  
  # Scopes
  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_posts, -> { includes(:posts) }
  
  # Secure password
  has_secure_password
  
  # Class methods
  def self.search(query)
    where("name LIKE ? OR email LIKE ?", "%#{query}%", "%#{query}%")
  end
  
  # Instance methods
  def full_name
    "#{first_name} #{last_name}".strip
  end
  
  def activate!
    update!(active: true, activated_at: Time.current)
  end
  
  private
  
  def downcase_email
    self.email = email.downcase
  end
  
  def create_default_profile
    create_profile!(bio: "Hello, I'm new here!")
  end
  
  def password_required?
    new_record? || password.present?
  end
end
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Rails Structure
```
app/
├── assets/              # CSS, JS, images
├── channels/            # Action Cable channels
├── controllers/         # Application controllers
│   ├── api/            # API controllers
│   ├── concerns/       # Shared controller modules
│   └── application_controller.rb
├── helpers/            # View helpers
├── javascript/         # Modern JS with Stimulus/Turbo
├── jobs/               # Background jobs
├── mailers/            # Email functionality
├── models/             # Active Record models
│   └── concerns/       # Shared model modules
├── services/           # Service objects
├── validators/         # Custom validators
└── views/              # ERB templates
    └── layouts/        # Layout templates
config/
├── routes.rb           # Route definitions
├── database.yml        # Database config
└── environments/       # Environment configs
db/
├── migrate/            # Database migrations
├── schema.rb          # Current schema
└── seeds.rb           # Seed data
spec/                   # RSpec tests
└── support/           # Test helpers
```

## 🎮 Controller Patterns

### RESTful Controllers
```ruby
# app/controllers/api/v1/users_controller.rb
module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!
      before_action :set_user, only: [:show, :update, :destroy]
      
      # GET /api/v1/users
      def index
        @users = User.active
                    .includes(:profile)
                    .page(params[:page])
                    .per(params[:per_page] || 20)
        
        render json: @users, each_serializer: UserSerializer
      end
      
      # GET /api/v1/users/:id
      def show
        render json: @user, serializer: UserDetailSerializer
      end
      
      # POST /api/v1/users
      def create
        @user = User.new(user_params)
        
        if @user.save
          render json: @user, status: :created
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/users/:id
      def update
        if @user.update(user_params)
          render json: @user
        else
          render json: { errors: @user.errors }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/users/:id
      def destroy
        @user.destroy
        head :no_content
      end
      
      private
      
      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'User not found' }, status: :not_found
      end
      
      def user_params
        params.require(:user).permit(:email, :name, :password, :password_confirmation)
      end
    end
  end
end
```

## 🛡️ Validation & Security

### Custom Validators
```ruby
# app/validators/email_validator.rb
class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    unless value =~ URI::MailTo::EMAIL_REGEXP
      record.errors.add(attribute, (options[:message] || "is not a valid email"))
    end
  end
end

# app/models/concerns/secure_password.rb
module SecurePassword
  extend ActiveSupport::Concern
  
  included do
    has_secure_password
    
    validates :password, 
      length: { minimum: 8 },
      format: { 
        with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
        message: "must include at least one lowercase letter, one uppercase letter, and one digit" 
      },
      if: :password_required?
  end
  
  private
  
  def password_required?
    password.present? || password_confirmation.present?
  end
end
```

## 🧪 Testing Strategy

### Requirements
- **MINIMUM 85% code coverage** for Rails apps
- **MUST use RSpec**
- **MUST test models, controllers, and services**
- **MUST use factories (FactoryBot)**

```ruby
# spec/models/user_spec.rb
require 'rails_helper'

RSpec.describe User, type: :model do
  # Test factories
  let(:user) { create(:user) }
  
  # Associations
  it { should have_many(:posts).dependent(:destroy) }
  it { should have_one(:profile).dependent(:destroy) }
  
  # Validations
  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email).case_insensitive }
  it { should validate_presence_of(:name) }
  it { should validate_length_of(:password).is_at_least(8) }
  
  # Scopes
  describe 'scopes' do
    let!(:active_user) { create(:user, active: true) }
    let!(:inactive_user) { create(:user, active: false) }
    
    it '.active returns only active users' do
      expect(User.active).to include(active_user)
      expect(User.active).not_to include(inactive_user)
    end
  end
  
  # Instance methods
  describe '#full_name' do
    it 'returns the full name' do
      user = build(:user, first_name: 'John', last_name: 'Doe')
      expect(user.full_name).to eq('John Doe')
    end
  end
  
  # Callbacks
  describe 'callbacks' do
    it 'downcases email before save' do
      user = create(:user, email: 'TEST@EXAMPLE.COM')
      expect(user.reload.email).to eq('test@example.com')
    end
    
    it 'creates profile after user creation' do
      expect { create(:user) }.to change(Profile, :count).by(1)
    end
  end
end

# spec/requests/api/v1/users_spec.rb
require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  let(:user) { create(:user) }
  let(:headers) { { 'Authorization' => "Bearer #{generate_token(user)}" } }
  
  describe 'GET /api/v1/users' do
    let!(:users) { create_list(:user, 3) }
    
    it 'returns a list of users' do
      get '/api/v1/users', headers: headers
      
      expect(response).to have_http_status(:ok)
      expect(json_response.size).to eq(4) # 3 + authenticated user
    end
  end
  
  describe 'POST /api/v1/users' do
    let(:valid_params) do
      {
        user: {
          email: 'new@example.com',
          name: 'New User',
          password: 'Password123',
          password_confirmation: 'Password123'
        }
      }
    end
    
    it 'creates a new user' do
      expect {
        post '/api/v1/users', params: valid_params, headers: headers
      }.to change(User, :count).by(1)
      
      expect(response).to have_http_status(:created)
      expect(json_response['email']).to eq('new@example.com')
    end
  end
end
```

## 🔄 Service Objects

### Business Logic Encapsulation
```ruby
# app/services/user_registration_service.rb
class UserRegistrationService
  attr_reader :user, :errors
  
  def initialize(user_params)
    @user_params = user_params
    @errors = []
  end
  
  def call
    ActiveRecord::Base.transaction do
      create_user
      send_welcome_email
      create_onboarding_tasks
      
      raise ActiveRecord::Rollback if @errors.any?
    end
    
    self
  end
  
  def success?
    @errors.empty?
  end
  
  private
  
  def create_user
    @user = User.new(@user_params)
    unless @user.save
      @errors.concat(@user.errors.full_messages)
    end
  end
  
  def send_welcome_email
    UserMailer.welcome(@user).deliver_later if @user.persisted?
  rescue => e
    @errors << "Failed to send welcome email: #{e.message}"
  end
  
  def create_onboarding_tasks
    return unless @user.persisted?
    
    OnboardingTasksCreator.new(@user).call
  end
end

# Usage in controller
def create
  service = UserRegistrationService.new(user_params).call
  
  if service.success?
    render json: service.user, status: :created
  else
    render json: { errors: service.errors }, status: :unprocessable_entity
  end
end
```

## 💅 Code Style & Quality

### RuboCop Configuration
```yaml
# .rubocop.yml
require:
  - rubocop-rails
  - rubocop-rspec

AllCops:
  NewCops: enable
  Exclude:
    - 'db/**/*'
    - 'config/**/*'
    - 'script/**/*'
    - 'bin/**/*'

Metrics/MethodLength:
  Max: 20

Metrics/ClassLength:
  Max: 300

Style/Documentation:
  Enabled: false

Rails/HasManyOrHasOneDependent:
  Enabled: true

RSpec/ExampleLength:
  Max: 10
```

## 📋 Development Commands

```bash
# Rails commands
rails server              # Start development server
rails console            # Interactive console
rails db:migrate         # Run migrations
rails db:seed           # Seed database
rails test              # Run tests
bundle exec rspec       # Run RSpec tests
bundle exec rubocop     # Check code style
bundle exec rubocop -A  # Auto-fix style issues
rails assets:precompile # Compile assets
```

## 🗄️ Database & Active Record

### Migration Best Practices
```ruby
# db/migrate/20240101000000_create_users.rb
class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.boolean :active, default: false, null: false
      t.datetime :activated_at
      
      t.timestamps
    end
    
    add_index :users, :email, unique: true
    add_index :users, :active
    add_index :users, [:active, :created_at]
  end
end

# Complex migration with reversibility
class AddFullTextSearchToArticles < ActiveRecord::Migration[7.0]
  def up
    execute <<-SQL
      ALTER TABLE articles ADD COLUMN searchable_content tsvector;
      CREATE INDEX articles_searchable_idx ON articles USING gin(searchable_content);
    SQL
  end
  
  def down
    remove_column :articles, :searchable_content
  end
end
```

## ⚠️ CRITICAL GUIDELINES

1. **FOLLOW Rails conventions** - Don't fight the framework
2. **VALIDATE in models** - Not just controllers
3. **MINIMUM 85% test coverage** - Rails apps need thorough testing
4. **USE Rails helpers** - Don't reinvent the wheel
5. **NEVER skip callbacks carelessly** - They ensure data integrity
6. **USE strong parameters** - Prevent mass assignment

## 📋 Pre-commit Checklist

- [ ] All tests passing with 85%+ coverage
- [ ] RuboCop passes without offenses
- [ ] Database migrations are reversible
- [ ] No N+1 queries (use bullet gem)
- [ ] Security vulnerabilities checked (brakeman)
- [ ] Seeds file updated if needed
- [ ] API documentation updated
- [ ] No hardcoded secrets

## Background Jobs

### Active Job Pattern
```ruby
# app/jobs/user_cleanup_job.rb
class UserCleanupJob < ApplicationJob
  queue_as :low_priority
  
  def perform(user_id)
    user = User.find(user_id)
    
    # Clean up user data
    user.posts.where('created_at < ?', 1.year.ago).destroy_all
    user.clear_cache
    
    # Log the cleanup
    Rails.logger.info "Cleaned up data for user #{user.id}"
  rescue ActiveRecord::RecordNotFound
    Rails.logger.error "User #{user_id} not found for cleanup"
  end
end

# Usage
UserCleanupJob.perform_later(user.id)
UserCleanupJob.set(wait: 1.hour).perform_later(user.id)
```

## Caching Strategies

```ruby
# Model caching
class User < ApplicationRecord
  def expensive_calculation
    Rails.cache.fetch([self, "expensive_calculation"], expires_in: 1.hour) do
      # Expensive operation here
      posts.joins(:comments).group(:user_id).count
    end
  end
end

# Controller caching
class PostsController < ApplicationController
  def index
    @posts = Rails.cache.fetch(['posts', params[:page]], expires_in: 5.minutes) do
      Post.published.includes(:author, :tags).page(params[:page])
    end
  end
end
```

## Workflow Rules

### Before Starting Any Task
- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Rails version compatibility
- Review existing patterns in codebase

### Rails Development Flow
1. Generate model/controller with Rails generators
2. Write migrations with proper indexes
3. Add model validations and associations
4. Implement controller with strong parameters
5. Create service objects for complex logic
6. Write comprehensive RSpec tests
7. Check for N+1 queries and security issues

{{#if prpConfig}}
### PRP Workflow
- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Rails-specific documentation
{{/if}}
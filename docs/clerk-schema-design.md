# EasyPick Clerk Integration Schema Design

## 📋 Overview

This document outlines the comprehensive subscription and payment data schema designed for EasyPick's integration with Clerk authentication, Supabase backend, and PayPal payment processing.

## 🏗️ Architecture Principles

### Core Design Decisions

1. **Clerk-First Authentication**: User IDs come directly from Clerk (no UUID generation)
2. **Separation of Concerns**: Clear separation between profiles, subscriptions, transactions, and usage
3. **PayPal Integration**: Native support for PayPal webhooks and subscription management
4. **Usage-Based Billing**: Comprehensive usage tracking with flexible limits
5. **Performance Optimized**: Strategic indexing for common query patterns
6. **Security by Design**: Row Level Security (RLS) policies for data protection

### Data Flow

```
Clerk User → clerk_profiles → clerk_subscriptions → clerk_transactions
                           ↘ clerk_usage_events
```

## 📊 Table Specifications

### 1. `clerk_profiles` - User Management

**Purpose**: Central user profile management linked to Clerk authentication

**Key Fields**:
- `id` (UUID): Clerk user ID (primary key, not generated)
- `role` (enum): User tier (free, pro, business)
- `plan` (string): Specific plan code (e.g., 'pro_monthly')
- `current_period_start/end`: Active billing period tracking
- `clerk_metadata`: Flexible storage for Clerk-specific data

**Business Rules**:
- ID must be provided from Clerk (no auto-generation)
- Role determines feature access and usage limits
- Plan links to subscription_plans table for detailed configuration

### 2. `clerk_subscriptions` - Subscription Lifecycle

**Purpose**: Track subscription history and state changes

**Key Fields**:
- `user_id`: Foreign key to clerk_profiles
- `status`: Current subscription state (active, canceled, past_due, etc.)
- `paypal_subscription_id`: PayPal subscription reference
- `current_period_start/end`: Billing cycle tracking
- `cancel_at_period_end`: Graceful cancellation handling

**Business Rules**:
- Only one active subscription per user (enforced by unique index)
- Automatic profile sync via triggers
- Supports trial periods and proration

### 3. `clerk_transactions` - Payment Tracking

**Purpose**: Record all financial transactions

**Key Fields**:
- `amount`: Amount in smallest currency unit (cents/won)
- `currency`: Multi-currency support (KRW, USD, EUR)
- `transaction_type`: Payment categorization (payment, refund, etc.)
- `paypal_tx_id`: PayPal transaction reference

**Business Rules**:
- All amounts stored in smallest currency unit for precision
- Links to subscriptions for subscription payments
- Supports various payment methods and transaction types

### 4. `clerk_usage_events` - Feature Usage Tracking

**Purpose**: Track feature usage for billing and analytics

**Key Fields**:
- `event_type`: Type of usage (compile_prompt, run_workflow, etc.)
- `count`: Number of units consumed
- `billing_period_start`: Links usage to billing cycles
- `metadata`: Flexible event data storage

**Business Rules**:
- Efficient querying for usage limit enforcement
- Aggregation by billing periods
- Supports various event types and extensible metadata

### 5. `subscription_plans` - Plan Configuration

**Purpose**: Define available subscription plans and their features

**Key Fields**:
- `plan_code`: Unique identifier (e.g., 'pro_monthly')
- `features`: JSON object defining feature flags
- `usage_limits`: JSON object defining usage quotas
- `paypal_plan_id`: PayPal plan reference

**Business Rules**:
- Central configuration for all plan features
- Flexible feature flags and usage limits
- Integration with PayPal plan management

## 🔧 Business Logic Functions

### Core Functions

1. **`has_active_subscription(user_id)`**
   - Returns boolean indicating active subscription status
   - Checks expiration dates and subscription status

2. **`get_usage_count(user_id, event_type, billing_start)`**
   - Returns usage count for specific event type in billing period
   - Supports custom billing period or defaults to current period

3. **`check_usage_limit(user_id, event_type, count)`**
   - Validates if user can perform additional usage
   - Enforces plan-based limits and free tier restrictions

4. **`record_usage_event(user_id, event_type, resource_id, count, metadata)`**
   - Records usage event with automatic limit checking
   - Returns boolean indicating success/failure

### Automation Triggers

1. **Profile Sync Trigger**
   - Automatically updates user profile when subscription changes
   - Handles activation, cancellation, and plan changes

2. **Timestamp Triggers**
   - Auto-updates `updated_at` fields
   - Maintains audit trail for changes

## 📈 Analytics and Monitoring

### Built-in Views

1. **`active_subscriptions`**
   - Overview of all active subscriptions
   - Includes expiration warnings and status

2. **`usage_analytics`**
   - Daily usage statistics by event type
   - Unique user counts and total usage

3. **`revenue_analytics`**
   - Monthly revenue breakdown by currency and type
   - Transaction counts and averages

4. **`user_lifecycle_metrics`**
   - User segmentation by role
   - Signup trends and subscription conversion

## 🔒 Security Model

### Row Level Security (RLS)

- **User Data Isolation**: Users can only access their own data
- **Service Role Access**: Full access for backend operations
- **Read-Only Public Data**: Subscription plans visible to all authenticated users

### Authentication Integration

- Uses Clerk user IDs as primary keys
- Compatible with Supabase auth context
- Supports both user-level and service-level operations

## 🚀 Implementation Guide

### 1. Database Setup

```sql
-- Apply the schema
\i supabase/clerk-integration-schema.sql
```

### 2. Clerk Integration

```javascript
// Frontend: Get Clerk user ID
const { user } = useAuth();
const clerkUserId = user.id;

// Backend: Create profile on first login
await supabase
  .from('clerk_profiles')
  .upsert({
    id: clerkUserId,
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName
  });
```

### 3. Usage Tracking

```javascript
// Record usage event
const success = await supabase.rpc('record_usage_event', {
  p_user_id: clerkUserId,
  p_event_type: 'compile_prompt',
  p_resource_id: promptId,
  p_metadata: { prompt_length: text.length }
});
```

### 4. Subscription Management

```javascript
// Check subscription status
const hasSubscription = await supabase.rpc('has_active_subscription', {
  p_user_id: clerkUserId
});

// Get usage limits
const usageCount = await supabase.rpc('get_usage_count', {
  p_user_id: clerkUserId,
  p_event_type: 'compile_prompt'
});
```

## 📋 Migration Strategy

### From Existing Schema

1. **Data Migration**: Map existing `user_profiles` to `clerk_profiles`
2. **Gradual Rollout**: Support both schemas during transition
3. **Feature Flags**: Control which users use new schema
4. **Validation**: Compare data consistency between systems

### PayPal Webhook Updates

The existing PayPal webhook handler needs updates to work with the new schema:

```typescript
// Updated webhook handler
await supabase
  .from('clerk_subscriptions')
  .update({
    status: 'active',
    paypal_subscription_id: event.resource.id
  })
  .eq('user_id', customId);
```

## 🎯 Key Benefits

1. **Scalable Architecture**: Supports millions of users with efficient indexing
2. **Flexible Usage Tracking**: Extensible event types and metadata
3. **Real-time Analytics**: Built-in views for business metrics
4. **Robust Security**: RLS policies and data isolation
5. **PayPal Integration**: Native webhook and subscription support
6. **Performance Optimized**: Strategic indexes for common queries

## 📊 Supabase Studio View

The schema creates the following tables visible in Supabase Studio:

- `clerk_profiles` - User profiles with Clerk integration
- `clerk_subscriptions` - Subscription lifecycle management  
- `clerk_transactions` - Payment and transaction history
- `clerk_usage_events` - Feature usage tracking
- `subscription_plans` - Plan definitions and configuration

All tables include proper relationships, constraints, and indexes for optimal performance and data integrity.
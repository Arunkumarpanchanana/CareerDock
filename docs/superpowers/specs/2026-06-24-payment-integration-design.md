# Payment Integration Design

## Overview

Add real-time payment processing with Instamojo and PhonePe. When a user pays, the webhook auto-updates their `plan_tier`. Admin can configure gateway credentials, plan prices, and coupon codes via admin UI.

## Architecture

```
[User clicks "Upgrade" on pricing page]
          ↓
[Optionally apply coupon code]
          ↓
[Create order API] → Returns checkout URL from gateway
          ↓
[User completes payment on gateway page]
          ↓
[Webhook from gateway → /api/webhooks/{gateway}]
          ↓
[Verify payment amount, update profiles.plan_tier, log transaction]
```

## Database

### `payment_configs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `gateway` | TEXT | `'instamojo' | 'phonepe'` |
| `api_key` | TEXT | |
| `api_secret` | TEXT | |
| `merchant_id` | TEXT | Nullable, PhonePe specific |
| `salt_key` | TEXT | Nullable, PhonePe specific |
| `is_active` | BOOLEAN | Default false |
| `updated_at` | TIMESTAMPTZ | |

### `plan_prices`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `plan_tier` | TEXT | `'premium' | 'premium_pro'` |
| `monthly_price` | INTEGER | In INR paise |
| `yearly_price` | INTEGER | In INR paise |
| `updated_at` | TIMESTAMPTZ | |

Seeded with defaults: Premium ₹299/₹3,000, Premium Pro ₹500/₹5,500. Admin can edit.

### `coupons`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `code` | TEXT | Unique, uppercase |
| `discount_type` | TEXT | `'percentage' | 'fixed'` |
| `discount_value` | INTEGER | Percentage (1-100) or fixed INR |
| `max_uses` | INTEGER | Nullable = unlimited |
| `current_uses` | INTEGER | Default 0 |
| `min_cart_amount` | INTEGER | Nullable = no minimum |
| `plan_tier` | TEXT | Nullable = any plan, or `'premium' | 'premium_pro'` |
| `expires_at` | TIMESTAMPTZ | Nullable = never expires |
| `is_active` | BOOLEAN | Default true |
| `created_at` | TIMESTAMPTZ | |

### `payment_transactions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles.id | |
| `plan_tier` | TEXT | `'premium' | 'premium_pro'` |
| `billing` | TEXT | `'monthly' | 'yearly'` |
| `original_amount` | INTEGER | Price before discount |
| `discount_amount` | INTEGER | 0 if no coupon |
| `final_amount` | INTEGER | Amount actually charged |
| `coupon_code` | TEXT | Nullable |
| `gateway` | TEXT | `'instamojo' | 'phonepe'` |
| `gateway_order_id` | TEXT | Order ID from gateway |
| `gateway_payment_id` | TEXT | Payment ID from gateway |
| `status` | TEXT | `'pending' | 'completed' | 'failed'` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

## Admin UI

**Route:** `/admin/payments`
- Tabbed or sectioned: **Gateways** | **Prices** | **Coupons**

### Gateways Tab
- List configured gateways with active/inactive badge
- "Add Gateway" button opens form
- Form: gateway selector, API key, secret, merchant ID, salt key, active toggle
- Save to `payment_configs` table

### Prices Tab
- Table: Plan | Monthly Price | Yearly Price | Actions
- Inline edit or modal to change prices
- Any change takes effect immediately on the pricing page

### Coupons Tab
- List all coupons: code, discount, uses, expiry, active status
- "Create Coupon" button opens form
- Form: code, discount type (%/fixed), value, max uses, min cart, plan filter, expiry date, active toggle

## API Endpoints

### POST /api/payments/create-order
- Input: `{ planTier, billing, couponCode? }`
- Validates user is authenticated
- Looks up current price from `plan_prices`
- If couponCode provided: validates coupon, computes discount
- Looks up active gateway config
- Creates order on gateway with `final_amount`
- Inserts `payment_transactions` with `status: 'pending'`
- Returns `{ checkoutUrl, orderId }`

### POST /api/coupons/validate
- Input: `{ code, planTier }`
- Returns `{ valid, discountType, discountValue, finalAmount }`
- Validates: code exists, active, not expired, under max uses, plan matches

### POST /api/webhooks/instamojo
- Receives webhook from Instamojo
- Verifies signature using `api_secret`
- Looks up transaction by `gateway_order_id`
- Verifies amount matches
- Updates `profiles.plan_tier` on user's profile
- Updates transaction to `'completed'`

### POST /api/webhooks/phonepe
- Receives webhook from PhonePe (X-VERIFY header)
- Verifies checksum using `salt_key`
- Same logic as Instamojo handler

### GET /api/payments/status?orderId=xxx
- Returns transaction status for polling

### PUT /api/admin/payments/prices
- Input: `{ planTier, monthlyPrice, yearlyPrice }`
- Admin-only: updates `plan_prices`

### POST /api/admin/coupons
- Admin-only: create/update coupon

## Pricing Page Changes

- Prices fetched dynamically from `/api/plan-prices` (instead of hardcoded)
- Coupon code input field on upgrade page
- "Apply" button calls `/api/coupons/validate` and shows discount
- "Upgrade" buttons call `/api/payments/create-order` with optional coupon
- After payment, polls `/api/payments/status` until completed

## Coupon Validation Rules

- Code is case-insensitive (stored uppercase)
- Can only use once per user (check `payment_transactions` for same user + coupon)
- If `expires_at` is set, must not be expired
- If `max_uses` is set, `current_uses < max_uses`
- If `plan_tier` is set, must match the selected plan
- If `min_cart_amount` is set, original amount must be ≥ min
- Percentage discount: capped at 100% (essentially free)
- Fixed discount: cannot exceed original amount (min charge ₹1)

## Non-Goals

- Refunds/partial refunds
- Subscription management (one-time payments for now)
- Encryption of stored credentials (can be added later)
- Coupon multi-use tracking per user

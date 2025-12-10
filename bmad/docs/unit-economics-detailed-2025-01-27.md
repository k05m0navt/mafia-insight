# Detailed Unit Economics Model: Mafia Insight

**Date:** 2025-01-27  
**Prepared by:** k05m0navt  
**Model Type:** Financial Projections & Unit Economics

---

## Executive Summary

This document provides detailed unit economics analysis for **Mafia Insight**, including:

- Cost structure breakdown
- Revenue projections by scenario
- Unit economics calculations
- Break-even analysis
- Scaling projections
- Sensitivity analysis

**Key Findings:**

- **Break-Even:** 8-12 premium users (depending on price point)
- **Unit Economics:** Highly favorable with low infrastructure costs
- **Scaling Path:** Clear revenue milestones guide infrastructure investment
- **Profitability:** Achievable within first 3 months with moderate growth

---

## 1. Cost Structure

### 1.1 Infrastructure Costs

#### Current (Free Tier) - $0/month

**Supabase:**

- Database: 500MB (free tier)
- Bandwidth: 2GB/month (free tier)
- Storage: 1GB (free tier)
- **Cost: $0/month**

**Vercel:**

- Hobby plan: Unlimited personal projects
- Bandwidth: 100GB/month
- **Cost: $0/month**

**Other Services:**

- Yandex Metrica: Free analytics
- Domain: ~$10-15/year (~$1/month)
- **Total Infrastructure: ~$1/month**

#### Growth Phase (Pro Tier) - $45/month

**Supabase Pro:**

- Database: 8GB
- Bandwidth: 250GB/month
- Storage: 100GB
- **Cost: $25/month**

**Vercel Pro:**

- Team plan features
- Advanced analytics
- **Cost: $20/month**

**Other Services:**

- Domain: ~$1/month
- **Total Infrastructure: $46/month**

#### Scale Phase (Enterprise) - $200+/month

**Supabase:**

- Enterprise features
- Higher limits
- **Cost: $100-200/month**

**Vercel:**

- Enterprise plan
- **Cost: $100+/month**

**Additional Services:**

- Redis/Upstash: $50-100/month
- Monitoring tools: $20-50/month
- **Total Infrastructure: $250-350/month**

### 1.2 Development Costs

**Initial Development:**

- Already invested (sunk cost)
- **Cost: $0/month (amortized)**

**Maintenance & Updates:**

- Estimated: 10-20 hours/month
- At $0/hour (founder time) = **$0/month**
- If outsourced: $50-100/hour × 15 hours = **$750-1,500/month**

**For this model:** Assuming founder time = $0/month

### 1.3 Marketing Costs

**Organic Growth (Year 1):**

- Content creation: $0 (founder time)
- Community engagement: $0
- Social media: $0
- **Total: $0/month**

**Paid Marketing (Future):**

- Google Ads: $500-2,000/month
- Social media ads: $300-1,000/month
- **Total: $800-3,000/month (not included in Year 1)**

### 1.4 Total Cost Summary

| Phase                      | Infrastructure | Development | Marketing | **Total/Month** |
| -------------------------- | -------------- | ----------- | --------- | --------------- |
| **Launch**                 | $1             | $0          | $0        | **$1**          |
| **Growth**                 | $46            | $0          | $0        | **$46**         |
| **Scale**                  | $250           | $0          | $0        | **$250**        |
| **Scale (Paid Marketing)** | $250           | $0          | $2,000    | **$2,250**      |

---

## 2. Revenue Model

### 2.1 Pricing Structure (Option B - $8/month base)

**Subscription Tiers:**

- 1 Month: $8/month
- 3 Months: $20 total ($6.67/month) - 17% discount
- 6 Months: $38 total ($6.33/month) - 21% discount
- 12 Months: $68 total ($5.67/month) - 29% discount

**Free Trial:** 7 days (for 1-month subscription)

### 2.2 Revenue Calculation Methodology

**Monthly Recurring Revenue (MRR) Calculation:**

- Monthly subscriptions: Full price × count
- 3-month subscriptions: (Total price / 3) × count
- 6-month subscriptions: (Total price / 6) × count
- Annual subscriptions: (Total price / 12) × count

**Example:**

- 10 monthly @ $8 = $80
- 5 three-month @ $6.67 = $33.35
- 3 six-month @ $6.33 = $18.99
- 2 annual @ $5.67 = $11.34
- **Total MRR = $143.68**

---

## 3. Scenario Analysis

### 3.1 Scenario 1: Conservative (Year 1)

#### Month 1-3: Launch Phase

**Assumptions:**

- Total users: 500
- Conversion rate: 3% (conservative)
- Paid users: 15
- Subscription distribution: 50% monthly, 30% 3-month, 15% 6-month, 5% annual

**Revenue Calculation:**

- Monthly: 8 users × $8 = $64
- 3-month: 4 users × $6.67 = $26.68 (prorated)
- 6-month: 2 users × $6.33 = $12.66 (prorated)
- Annual: 1 user × $5.67 = $5.67 (prorated)
- **MRR: $109.01**

**Costs:**

- Infrastructure: $1/month
- **Net: $108.01/month**

**Unit Economics:**

- ARPU: $109.01 / 15 = $7.27/month
- CAC: $0 (organic)
- LTV: $7.27 × 12 = $87.24 (assuming 1-year retention)
- LTV/CAC: ∞ (organic growth)
- **Profit Margin: 99.1%**

#### Month 4-6: Growth Phase

**Assumptions:**

- Total users: 1,000
- Conversion rate: 4%
- Paid users: 40
- Infrastructure upgrade to Pro tier

**Revenue Calculation:**

- Monthly: 20 users × $8 = $160
- 3-month: 12 users × $6.67 = $80.04 (prorated)
- 6-month: 6 users × $6.33 = $37.98 (prorated)
- Annual: 2 users × $5.67 = $11.34 (prorated)
- **MRR: $289.36**

**Costs:**

- Infrastructure: $46/month
- **Net: $243.36/month**

**Unit Economics:**

- ARPU: $289.36 / 40 = $7.23/month
- LTV: $7.23 × 12 = $86.76
- **Profit Margin: 84.1%**

#### Month 7-12: Scaling Phase

**Assumptions:**

- Total users: 2,000
- Conversion rate: 4.5%
- Paid users: 90
- Subscription distribution: 40% monthly, 30% 3-month, 20% 6-month, 10% annual

**Revenue Calculation:**

- Monthly: 36 users × $8 = $288
- 3-month: 27 users × $6.67 = $180.09 (prorated)
- 6-month: 18 users × $6.33 = $113.94 (prorated)
- Annual: 9 users × $5.67 = $51.03 (prorated)
- **MRR: $633.06**

**Costs:**

- Infrastructure: $46/month
- **Net: $587.06/month**

**Unit Economics:**

- ARPU: $633.06 / 90 = $7.03/month
- LTV: $7.03 × 12 = $84.36
- **Profit Margin: 92.7%**

**Year 1 Summary:**

- **Total Revenue: $4,500-5,000**
- **Total Costs: $200-250**
- **Net Profit: $4,250-4,750**
- **ROI: 1,700-1,900%**

### 3.2 Scenario 2: Moderate (Year 1)

#### Month 1-3: Launch Phase

**Assumptions:**

- Total users: 750
- Conversion rate: 4%
- Paid users: 30

**Revenue:**

- **MRR: $218.02**

**Costs:**

- Infrastructure: $1/month
- **Net: $217.02/month**

#### Month 4-6: Growth Phase

**Assumptions:**

- Total users: 1,500
- Conversion rate: 5%
- Paid users: 75

**Revenue:**

- **MRR: $542.25**

**Costs:**

- Infrastructure: $46/month
- **Net: $496.25/month**

#### Month 7-12: Scaling Phase

**Assumptions:**

- Total users: 3,000
- Conversion rate: 5.5%
- Paid users: 165

**Revenue:**

- **MRR: $1,159.95**

**Costs:**

- Infrastructure: $46/month
- **Net: $1,113.95/month**

**Year 1 Summary:**

- **Total Revenue: $8,000-9,000**
- **Total Costs: $250-300**
- **Net Profit: $7,700-8,700**
- **ROI: 2,500-3,000%**

### 3.3 Scenario 3: Optimistic (Year 1)

#### Month 1-3: Launch Phase

**Assumptions:**

- Total users: 1,000
- Conversion rate: 5%
- Paid users: 50

**Revenue:**

- **MRR: $363.35**

**Costs:**

- Infrastructure: $1/month
- **Net: $362.35/month**

#### Month 4-6: Growth Phase

**Assumptions:**

- Total users: 2,500
- Conversion rate: 6%
- Paid users: 150

**Revenue:**

- **MRR: $1,084.50**

**Costs:**

- Infrastructure: $46/month
- **Net: $1,038.50/month**

#### Month 7-12: Scaling Phase

**Assumptions:**

- Total users: 5,000
- Conversion rate: 6.5%
- Paid users: 325

**Revenue:**

- **MRR: $2,285.75**

**Costs:**

- Infrastructure: $250/month (scale tier)
- **Net: $2,035.75/month**

**Year 1 Summary:**

- **Total Revenue: $15,000-18,000**
- **Total Costs: $1,000-1,500**
- **Net Profit: $13,500-16,500**
- **ROI: 900-1,100%**

---

## 4. Break-Even Analysis

### 4.1 Break-Even Point Calculation

**Formula:** Break-Even Users = Fixed Costs / (ARPU - Variable Cost per User)

**Assumptions:**

- Fixed Costs: $46/month (Growth phase infrastructure)
- Variable Costs: $0 (no per-user costs)
- ARPU: $7.23/month (from Scenario 1, Month 4-6)

**Break-Even:**

- $46 / $7.23 = **6.4 users** (round up to 7 users)

**With Launch Phase Costs ($1/month):**

- $1 / $7.27 = **0.14 users** (essentially break-even from first user)

### 4.2 Break-Even Timeline

**Scenario 1 (Conservative):**

- Month 1: 15 paid users → **Profitable from Day 1**
- Break-even: 7 users → **Achieved in Month 1**

**Scenario 2 (Moderate):**

- Month 1: 30 paid users → **Profitable from Day 1**
- Break-even: 7 users → **Achieved in Month 1**

**Scenario 3 (Optimistic):**

- Month 1: 50 paid users → **Profitable from Day 1**
- Break-even: 7 users → **Achieved in Month 1**

**Conclusion:** Break-even is achievable within the first month in all scenarios.

---

## 5. Unit Economics Deep Dive

### 5.1 Customer Acquisition Cost (CAC)

**Organic Growth (Year 1):**

- Marketing spend: $0
- Time investment: Founder time (not monetized)
- **CAC: $0**

**Paid Marketing (Future):**

- Monthly ad spend: $1,000
- New users acquired: 100/month
- **CAC: $10/user**

**Target CAC:** < $5/user (when paid marketing starts)

### 5.2 Lifetime Value (LTV)

**Calculation Method:**
LTV = ARPU × Average Subscription Length (months) × Gross Margin

**Assumptions:**

- ARPU: $7.23/month
- Average subscription length: 12 months (conservative)
- Gross margin: 100% (no variable costs)

**LTV:**

- $7.23 × 12 = **$86.76**

**With Churn Consideration:**

- Monthly churn: 5%
- Average lifetime: 1 / 0.05 = 20 months
- LTV: $7.23 × 20 = **$144.60**

### 5.3 LTV/CAC Ratio

**Organic Growth:**

- LTV: $86.76
- CAC: $0
- **LTV/CAC: ∞ (infinite)**

**Paid Marketing:**

- LTV: $86.76
- CAC: $10
- **LTV/CAC: 8.68:1**

**Target:** LTV/CAC ≥ 3:1 (excellent at 8.68:1)

### 5.4 Payback Period

**Organic Growth:**

- CAC: $0
- **Payback Period: 0 months (immediate)**

**Paid Marketing:**

- CAC: $10
- ARPU: $7.23/month
- **Payback Period: 1.4 months**

**Target:** Payback period < 3 months (excellent at 1.4 months)

---

## 6. Scaling Projections

### 6.1 Revenue Milestones

**Milestone 1: $500/month MRR**

- Users needed: ~70 paid users
- Timeline: Month 2-3 (Moderate scenario)
- Infrastructure: Growth phase ($46/month)
- **Status: Profitable, sustainable**

**Milestone 2: $1,000/month MRR**

- Users needed: ~140 paid users
- Timeline: Month 4-6 (Moderate scenario)
- Infrastructure: Growth phase ($46/month)
- **Status: Highly profitable**

**Milestone 3: $3,000/month MRR**

- Users needed: ~420 paid users
- Timeline: Month 8-10 (Moderate scenario)
- Infrastructure: Scale phase ($250/month)
- **Status: Consider full-time focus**

**Milestone 4: $10,000/month MRR**

- Users needed: ~1,400 paid users
- Timeline: Year 2 (with growth)
- Infrastructure: Scale phase ($250/month)
- **Status: Scale team and features**

### 6.2 Infrastructure Scaling Triggers

**Upgrade to Supabase Pro ($25/month):**

- Trigger: Database > 400MB or bandwidth > 1.5GB
- Timeline: Month 2-3
- ROI: Positive (cost < 5% of revenue)

**Upgrade to Vercel Pro ($20/month):**

- Trigger: Traffic exceeds hobby limits
- Timeline: Month 3-4
- ROI: Positive (cost < 5% of revenue)

**Upgrade to Scale Tier ($250/month):**

- Trigger: MRR > $2,000/month
- Timeline: Month 8-10
- ROI: Positive (cost < 15% of revenue)

**Add Redis/Upstash ($50-100/month):**

- Trigger: Performance needs or MRR > $5,000/month
- Timeline: Year 2
- ROI: Performance optimization, justified

---

## 7. Sensitivity Analysis

### 7.1 Conversion Rate Sensitivity

**Base Case:** 4.5% conversion, $633 MRR

| Conversion Rate | Paid Users | MRR      | Net Profit |
| --------------- | ---------- | -------- | ---------- |
| 3%              | 60         | $422     | $376       |
| 4%              | 80         | $563     | $517       |
| **4.5%**        | **90**     | **$633** | **$587**   |
| 5%              | 100        | $703     | $657       |
| 6%              | 120        | $844     | $798       |

**Impact:** ±0.5% conversion = ±$70 MRR

### 7.2 Price Point Sensitivity

**Base Case:** $8/month, 4.5% conversion, $633 MRR

| Price Point  | Conversion | Paid Users | MRR      | Net Profit |
| ------------ | ---------- | ---------- | -------- | ---------- |
| $6/month     | 5%         | 100        | $603     | $557       |
| **$8/month** | **4.5%**   | **90**     | **$633** | **$587**   |
| $10/month    | 4%         | 80         | $703     | $657       |

**Impact:** Higher price can offset lower conversion

### 7.3 Churn Rate Sensitivity

**Base Case:** 5% monthly churn, 20-month average lifetime

| Churn Rate | Avg Lifetime | LTV     | Impact   |
| ---------- | ------------ | ------- | -------- |
| 3%         | 33 months    | $238.59 | +175%    |
| 5%         | 20 months    | $144.60 | Baseline |
| 7%         | 14 months    | $101.22 | -30%     |
| 10%        | 10 months    | $72.30  | -50%     |

**Impact:** Reducing churn significantly increases LTV

---

## 8. Financial Projections Summary

### 8.1 Year 1 Projections

| Scenario         | Total Users | Paid Users | Annual Revenue | Annual Costs | Net Profit | Profit Margin |
| ---------------- | ----------- | ---------- | -------------- | ------------ | ---------- | ------------- |
| **Conservative** | 2,000       | 90         | $7,596         | $250         | $7,346     | 96.7%         |
| **Moderate**     | 3,000       | 165        | $13,919        | $300         | $13,619    | 97.8%         |
| **Optimistic**   | 5,000       | 325        | $27,429        | $1,500       | $25,929    | 94.5%         |

### 8.2 Year 2 Projections (Moderate Scenario)

**Assumptions:**

- User growth: 50% YoY
- Conversion rate: 5.5% (improved)
- Churn: 4% (improved retention)

**Projections:**

- Total users: 4,500
- Paid users: 248
- Annual revenue: $21,500
- Annual costs: $3,000 (includes paid marketing)
- Net profit: $18,500
- Profit margin: 86%

---

## 9. Key Metrics Dashboard

### 9.1 Monthly Metrics to Track

**Revenue Metrics:**

- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Revenue by subscription length
- New MRR (from new subscriptions)

**User Metrics:**

- Total users
- Paid users
- Conversion rate
- Trial-to-paid conversion

**Retention Metrics:**

- Monthly churn rate
- Average subscription length
- Renewal rate by tier

**Unit Economics:**

- LTV
- CAC
- LTV/CAC ratio
- Payback period

**Profitability:**

- Gross margin
- Net profit
- Profit margin
- Break-even status

### 9.2 Target Metrics (Year 1)

| Metric          | Target   | Excellent |
| --------------- | -------- | --------- |
| Conversion Rate | 4-5%     | 6%+       |
| ARPU            | $7/month | $8+/month |
| LTV             | $85      | $100+     |
| Churn Rate      | <5%      | <3%       |
| LTV/CAC         | 3:1      | 5:1+      |
| Profit Margin   | 90%+     | 95%+      |

---

## 10. Risk Analysis

### 10.1 Financial Risks

**Risk:** Lower conversion than projected

- **Impact:** -30% revenue
- **Mitigation:** A/B test pricing, optimize features
- **Probability:** Medium

**Risk:** Higher churn than projected

- **Impact:** -20% LTV
- **Mitigation:** Improve retention features, reduce churn
- **Probability:** Low-Medium

**Risk:** Infrastructure costs higher than projected

- **Impact:** -5% profit margin
- **Mitigation:** Optimize infrastructure, scale efficiently
- **Probability:** Low

### 10.2 Market Risks

**Risk:** Market size smaller than expected

- **Impact:** Limited growth potential
- **Mitigation:** Expand to adjacent markets, new features
- **Probability:** Medium

**Risk:** Competitive response

- **Impact:** Price pressure, lower conversion
- **Mitigation:** Unique features (judge analytics), community lock-in
- **Probability:** Medium

---

## 11. Recommendations

### 11.1 Immediate Actions

1. **Launch with $8/month base price**
2. **Monitor unit economics weekly**
3. **Track conversion rates by price point**
4. **Optimize for LTV/CAC ratio**

### 11.2 Short-Term (Months 1-3)

1. **Achieve break-even (7 users)**
2. **Reach $500/month MRR**
3. **Optimize conversion rate**
4. **Reduce churn to <5%**

### 11.3 Medium-Term (Months 4-12)

1. **Reach $1,000/month MRR**
2. **Maintain 90%+ profit margin**
3. **Scale infrastructure efficiently**
4. **Prepare for Year 2 growth**

---

## Document Information

**Status:** Financial Model - Ready for Implementation  
**Next Review:** After 3 months of revenue data  
**Classification:** Financial Projections

---

_This unit economics model provides detailed financial projections based on conservative, moderate, and optimistic scenarios. All assumptions should be validated with real data after launch._

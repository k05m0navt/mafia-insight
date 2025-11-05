# FREE IPv4 Solution for Russia Connections

## Quick Answer

**You don't need to pay for IPv4!** Use the **FREE Supavisor pooler** that's included with every Supabase project. It supports both IPv4 and IPv6.

## The Problem

- Direct Supabase connections use **IPv6 only** (requires paid IPv4 add-on)
- Some regions (like Russia) may not have reliable IPv6 connectivity
- The error you see: `Can't reach database server at aws-1-eu-north-1.pooler.supabase.com:5432`

## The FREE Solution

Supabase provides a **FREE shared connection pooler (Supavisor)** that:

- ✅ Supports **both IPv4 and IPv4**
- ✅ **FREE** (included with every project)
- ✅ Works from Russia and other IPv6-limited regions
- ✅ No paid add-on needed

## How to Get Your FREE Pooler Connection String

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/database
2. Scroll to **Connection String** section
3. Click **Connection pooling** tab
4. Copy the **Transaction mode** (port 6543) connection string:
   ```
   postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

## Update Your DATABASE_URL

Replace your current `DATABASE_URL` with the pooler connection string:

```bash
# Transaction mode (recommended for Next.js)
DATABASE_URL="postgres://postgres.fgjfyixytmoiwkdmvkju:your-password@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## What's Already Fixed

The code has been updated to:

1. ✅ Automatically add `pgbouncer=true` parameter
2. ✅ Increase connection timeouts for slow connections
3. ✅ Add retry logic for connection failures
4. ✅ Warn if using direct connection instead of pooler

## Next Steps

1. **Get your pooler connection string** from Supabase dashboard (see above)
2. **Update your `.env.local`** with the new `DATABASE_URL`
3. **Restart your dev server**
4. **Test the `/players` page** - it should work now!

## Cost Comparison

| Solution                        | Cost      | IPv4 Support   |
| ------------------------------- | --------- | -------------- |
| Direct Connection               | Free      | ❌ (IPv6 only) |
| Direct Connection + IPv4 Add-on | ~$4/month | ✅             |
| **Supavisor Pooler**            | **FREE**  | **✅**         |

**Choose the pooler - it's free and works!**

## Still Having Issues?

If you're still getting connection errors after switching to the pooler:

1. Verify the connection string format is correct
2. Check that you're using port `6543` (transaction mode) or `5432` (session mode)
3. Ensure `pgbouncer=true` is in the query string (code adds this automatically)
4. Check Supabase dashboard for any service outages
5. Try session mode (port 5432) if transaction mode doesn't work

## References

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#shared-pooler)
- [Supavisor Explained](https://github.com/orgs/supabase/discussions/27388)
- [IPv6 Connection Issues](https://github.com/orgs/supabase/discussions/20951)

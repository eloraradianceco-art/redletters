import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { session_id, user_id } = req.query
  if (!session_id) return res.status(400).json({ error:'Missing session_id' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion:'2024-04-10' })
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') return res.status(200).json({ paid:false })
    const stripeEmail = session.customer_details?.email
    const now = new Date().toISOString()

    if (user_id) {
      await supabase.from('rl_profiles').upsert({
        id:user_id, premium:true, premium_at:now, stripe_session_id:session_id
      }, { onConflict:'id' })
    }
    if (stripeEmail) {
      const { data:authData } = await supabase.auth.admin.listUsers()
      const match = authData?.users?.find(u => u.email?.toLowerCase() === stripeEmail.toLowerCase())
      if (match && match.id !== user_id) {
        await supabase.from('rl_profiles').upsert({
          id:match.id, premium:true, premium_at:now, stripe_session_id:session_id
        }, { onConflict:'id' })
      }
    }
    return res.status(200).json({ paid:true, email:stripeEmail })
  } catch(err) {
    return res.status(400).json({ error:'Invalid session', detail:err.message })
  }
}

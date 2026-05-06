
-- Explicit deny-all policy on realtime.messages.
-- Without any policy, RLS blocks access too, but the scanner flags the absence
-- of policies. With this explicit policy, subscriptions are denied unless
-- a future, more specific policy grants access for a particular topic.
DROP POLICY IF EXISTS "Deny all realtime subscriptions by default" ON realtime.messages;
CREATE POLICY "Deny all realtime subscriptions by default"
ON realtime.messages
FOR SELECT
TO authenticated, anon
USING (false);

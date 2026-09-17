const https = require('https');
const sql = "ALTER TABLE contact_exchanges DROP CONSTRAINT ce_status_check; ALTER TABLE contact_exchanges ADD CONSTRAINT ce_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked', 'withdrawn'));";
const body = JSON.stringify({ query: sql });
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YWR2ZWlndWJ1Z2ZpaWplZGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAxNDE0MywiZXhwIjoyMTAxNTkwMTQzfQ.17bpr7TAtAi_YgfETCm799QvpzWCBoHxQ1Ms8SO6ivw";
const options = {
  hostname: "huadveigubugfiijedek.supabase.co",
  path: "/rest/v1/rpc/exec_sql",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": token,
    "Authorization": "Bearer " + token,
    "Content-Length": Buffer.byteLength(body)
  }
};
const req = https.request(options, res => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("STATUS:", res.statusCode, "BODY:", data));
});
req.on("error", e => console.error("ERROR:", e.message));
req.write(body);
req.end();

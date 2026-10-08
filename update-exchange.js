const fs = require('fs');

let content = fs.readFileSync('src/app/api/exchange/route.ts', 'utf8');

// Update schema
const oldSchema = `const loggedInExchangeSchema = z.object({
  targetProfileId: z.string().uuid(),
  sourceProfileId: z.string().uuid(),
  sourceCardUid: z.string().max(64).optional().nullable(),
});`;

const newSchema = `const loggedInExchangeSchema = z.object({
  targetProfileId: z.string().uuid(),
  sourceProfileId: z.string().uuid(),
  sourceCardUid: z.string().max(64).optional().nullable(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
});`;

if (content.includes(oldSchema)) {
  content = content.replace(oldSchema, newSchema);
}

// Update logic
const oldLogic = `  const sourceProfile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, data.sourceProfileId),
      eq(profiles.userId, user.id)
    )
  });

  if (!sourceProfile) {
    return NextResponse.json({ error: 'Source profile not found or not owned by user' }, { status: 403 });
  }`;

const newLogic = `  const sourceProfile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, data.sourceProfileId),
      eq(profiles.userId, user.id)
    )
  });

  if (!sourceProfile) {
    return NextResponse.json({ error: 'Source profile not found or not owned by user' }, { status: 403 });
  }

  // Update profile if data provided
  await db.update(profiles)
    .set({
      firstName: data.firstName ?? sourceProfile.firstName,
      lastName: data.lastName ?? sourceProfile.lastName,
      email: data.email ?? sourceProfile.email,
      phone: data.phone ?? sourceProfile.phone,
      jobTitle: data.jobTitle ?? sourceProfile.jobTitle,
      companyName: data.companyName ?? sourceProfile.companyName,
    })
    .where(eq(profiles.id, sourceProfile.id));`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
}

fs.writeFileSync('src/app/api/exchange/route.ts', content);
console.log('Updated exchange API');

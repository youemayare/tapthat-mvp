async function testProfileSave() {
  try {
    const res = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Umar',
        lastName: 'Khan',
        companyName: 'TapThat',
        isPublished: true,
      }),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testProfileSave();

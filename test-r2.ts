import { loadEnvConfig } from '@next/env';
import { getUploadUrl, getPublicUrl } from './src/lib/r2/index.js';
// We need to compile it or just run it via ts-node

async function test() {
  loadEnvConfig(process.cwd());
  const key = 'test/avatar/123.jpg';
  try {
    const uploadUrl = await getUploadUrl(key, 'image/jpeg');
    const publicUrl = getPublicUrl(key);
    console.log('Upload URL:', uploadUrl);
    console.log('Public URL:', publicUrl);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();

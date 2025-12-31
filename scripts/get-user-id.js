/**
 * Helper script to get your Supabase User ID
 * Run this in browser console after logging in, or use the instructions below
 * 
 * Usage in browser console:
 * 1. Log in to your app
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste the code below
 */

// Method 1: If you have access to Supabase client
(async () => {
  try {
    // Import Supabase (adjust path if needed)
    const { supabase } = await import('/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('YOUR USER ID:');
      console.log(session.user.id);
      console.log('═══════════════════════════════════════════════════════');
      console.log('\nCopy this ID and add it to .env.local:');
      console.log(`TEST_USER_ID=${session.user.id}`);
      console.log(`NEXT_PUBLIC_TEST_USER_ID=${session.user.id}`);
    } else {
      console.log('No active session. Please log in first.');
    }
  } catch (error) {
    console.error('Error:', error);
    console.log('\nTry Method 2 instead (see below)');
  }
})();

// Method 2: Check localStorage (if Supabase stores session there)
const checkLocalStorage = () => {
  const keys = Object.keys(localStorage);
  const supabaseKey = keys.find(key => key.includes('supabase') && key.includes('auth'));
  
  if (supabaseKey) {
    try {
      const sessionData = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
      if (sessionData?.user?.id) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('YOUR USER ID (from localStorage):');
        console.log(sessionData.user.id);
        console.log('═══════════════════════════════════════════════════════');
        return sessionData.user.id;
      }
    } catch (e) {
      console.log('Could not parse localStorage data');
    }
  }
  console.log('User ID not found in localStorage');
  return null;
};

// Method 3: Manual check - run this in console
console.log('\n═══════════════════════════════════════════════════════');
console.log('TO GET YOUR USER ID:');
console.log('═══════════════════════════════════════════════════════');
console.log('\nOption 1: Browser Console');
console.log('1. Log in to your app');
console.log('2. Open DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Type: user?.id (if user object is available)');
console.log('\nOption 2: Supabase Dashboard');
console.log('1. Go to https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to Authentication → Users');
console.log('4. Find your user and copy the ID (UUID)');
console.log('\nOption 3: Add temporary code to any page');
console.log('Add this to a page component:');
console.log('  const { user } = useAuth();');
console.log('  console.log("User ID:", user?.id);');
console.log('═══════════════════════════════════════════════════════\n');


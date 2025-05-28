const { createRouter } = require('./packages/router/dist/index.js');

console.log('Testing Unicode emoji bug...');

// Test case 1: Without root path (should work)
console.log('\n=== Test 1: Without root path ===');
try {
    const router1 = createRouter([
        { name: 'home', path: '/' },
        { name: 'search', path: '/search' }
    ]);
    
    const state1 = router1.matchPath('/search?q=测试🚀');
    console.log('✅ Success without root path:', state1);
} catch (error) {
    console.log('❌ Error without root path:', error.message);
}

// Test case 2: With root path (might fail)
console.log('\n=== Test 2: With root path ===');
try {
    const router2 = createRouter([
        { name: 'home', path: '/' },
        { name: 'search', path: '/search' }
    ], {
        defaultRoute: 'home'
    });
    
    router2.setRootPath('/app');
    
    const state2 = router2.matchPath('/app/search?q=测试🚀');
    console.log('✅ Success with root path:', state2);
} catch (error) {
    console.log('❌ Error with root path:', error.message);
    console.log('Stack:', error.stack);
}

// Test case 3: More complex emoji
console.log('\n=== Test 3: Complex emoji ===');
try {
    const router3 = createRouter([
        { name: 'home', path: '/' },
        { name: 'search', path: '/search' }
    ]);
    
    router3.setRootPath('/app');
    
    const state3 = router3.matchPath('/app/search?q=👨‍💻🌟🎉');
    console.log('✅ Success with complex emoji:', state3);
} catch (error) {
    console.log('❌ Error with complex emoji:', error.message);
} 
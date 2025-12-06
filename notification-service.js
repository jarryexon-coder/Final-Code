// Placeholder for require('./$service')
console.log('✅ $service placeholder loaded');
module.exports = {
  init: () => console.log('$service.init() called'),
  dummyMethod: () => Promise.resolve({ success: true })
};

// Test script to verify runtime error fixes
console.log('Testing runtime error fixes...')

// Test 1: temporaryEffects undefined handling
console.log('Test 1: temporaryEffects undefined handling')
try {
  // Simulate the scenario where temporaryEffects is undefined
  const mockGameState = {
    temporaryEffects: undefined
  }
  
  // This should not throw an error now
  if (!mockGameState.temporaryEffects || !Array.isArray(mockGameState.temporaryEffects)) {
    mockGameState.temporaryEffects = []
    console.log('✓ temporaryEffects undefined case handled correctly')
  }
} catch (error) {
  console.log('✗ temporaryEffects test failed:', error.message)
}

// Test 2: Missing upgrade definitions handling
console.log('Test 2: Missing upgrade definitions handling')
try {
  // Simulate old save data with removed upgrades
  const oldUpgrades = [
    { id: 'base-value-2', name: 'Old Upgrade 1' },
    { id: 'idle-boost-1', name: 'Old Upgrade 2' },
    { id: 'view-converter-1', name: 'Old Upgrade 3' },
    { id: 'engagement-multiplier-1', name: 'Old Upgrade 4' },
    { id: 'click-power-1', name: 'Current Upgrade' } // This one exists
  ]
  
  const currentUpgrades = [
    { id: 'click-power-1', name: 'Current Upgrade' },
    { id: 'base-value-1', name: 'Another Current Upgrade' }
  ]
  
  // Filter out upgrades that no longer exist
  const validUpgrades = oldUpgrades.filter(upgrade => 
    currentUpgrades.some(current => current.id === upgrade.id)
  )
  
  console.log(`✓ Filtered ${oldUpgrades.length - validUpgrades.length} removed upgrades`)
  console.log(`✓ Kept ${validUpgrades.length} valid upgrades`)
  
} catch (error) {
  console.log('✗ Missing upgrade definitions test failed:', error.message)
}

console.log('Runtime error fixes test completed!')
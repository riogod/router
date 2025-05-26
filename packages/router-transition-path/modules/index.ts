/**
 * @fileoverview Router Transition Path
 * 
 * This package provides utilities for calculating transition paths between router states
 * and determining which route nodes need to be updated during navigation.
 * 
 * Key features:
 * - Calculate which route segments to activate/deactivate during transitions
 * - Optimize component updates by determining which nodes are affected
 * - Handle parameter changes and route hierarchy analysis
 * - Support for reload options and complex route structures
 * 
 */

import transitionPath, { nameToIDs } from './transitionPath'
import shouldUpdateNode from './shouldUpdateNode'

// Export utility functions
export { shouldUpdateNode, nameToIDs }

// Export main transition path calculator as default
export default transitionPath

// Re-export types for convenience
export type { State, TransitionPath, SegmentParams } from './transitionPath'

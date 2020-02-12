const target: import('typed-inject').TargetToken = '$target';
const injector: import('typed-inject').InjectorToken = '$injector';

/**
 * Common tokens used for dependency injection (see typed-inject readme for more information)
 */
export const commonTokens = Object.freeze({
  getLogger: 'getLogger' as const,
  injector,
  logger: 'logger' as const,
  mutatorDescriptor: 'mutatorDescriptor' as const,
  options: 'options' as const,
  pluginResolver: 'pluginResolver' as const,
  produceSourceMaps: 'produceSourceMaps' as const,
  sandboxFileNames: 'sandboxFileNames' as const,
  fileConstructor: 'fileConstructor' as const,
  target
});

/**
 * Helper method to create string literal tuple type.
 * @example
 * ```ts
 * const inject = tokens('foo', 'bar');
 * const inject2: ['foo', 'bar'] = ['foo', 'bar'];
 * ```
 * @param tokens The tokens as args
 */
export function tokens<TS extends string[]>(...tokens: TS): TS {
  return tokens;
}

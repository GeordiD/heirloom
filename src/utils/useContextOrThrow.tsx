import { useContext, type Context } from 'react';

export function useContextOrThrow<T>(context: Context<T>) {
  const value = useContext(context);

  if (!value) {
    throw new Error(
      `Unable to find context '${context.displayName}' -- did you forget to use a provider?`,
    );
  }

  return value;
}

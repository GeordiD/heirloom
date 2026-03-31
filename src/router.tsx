import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getContext } from './integrations/tanstack-query/root-provider';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const { queryClient } = getContext();

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient, wrapQueryClient: false });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

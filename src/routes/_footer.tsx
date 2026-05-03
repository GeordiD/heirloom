import { Footer } from '#/components/Footer';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_footer')({
  component: FooterLayout,
});

function FooterLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}

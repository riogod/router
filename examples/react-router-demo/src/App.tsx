import { createRouter, type Router } from '@riogz/router';
import { RouterProvider,  Link, RouteNode } from '@riogz/react-router';
import browserPlugin from '@riogz/router-plugin-browser';

// Описание маршрутов (без notFound!)
const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'profile', path: '/profile/:userId' },
];

// Инициализация роутера с browserPlugin ДО start
const router: Router = createRouter(routes, {
  allowNotFound: true
});
router.usePlugin(browserPlugin());
router.start();

console.log('[router-demo] router started');

function Home() {
  console.log('[RouteNode] Home');
  return <h2>Главная страница</h2>;
}
function About() {
  console.log('[RouteNode] About');
  return <h2>О проекте</h2>;
}
function Profile({ userId }: { userId: string }) {
  console.log('[RouteNode] Profile', userId);
  return <h2>Профиль пользователя: {userId}</h2>;
}

function NotFound() {
  console.log('[RouteNode] NotFound');
  return <h2>Страница не найдена</h2>;
}

export default function App() {
  return (
    <RouterProvider router={router}>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Link routeName="home">Главная</Link>
        <Link routeName="about">О проекте</Link>
        <Link routeName="profile" routeParams={{ userId: '42' }}>
          Профиль
        </Link>
      </nav>
      <RouteNode nodeName="home">
        {() => <Home />}
      </RouteNode>
      <RouteNode nodeName="about">
        {() => <About />}
      </RouteNode>
      <RouteNode nodeName="profile">
        {({ route }) => <Profile userId={route.params.userId} />}
      </RouteNode>
      <RouteNode nodeName="@@router/UNKNOWN_ROUTE">
        {() => <NotFound />}
      </RouteNode>
    </RouterProvider>
  );
}

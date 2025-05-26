import { createRouter, type Route, type Router } from '@riogz/router';
import { RouterProvider, Link, RouteNode, useRoute } from '@riogz/react-router';
import browserPlugin from '@riogz/router-plugin-browser';
import loggerPlugin from '@riogz/router-plugin-logger';

const routes: Route[] = [
  {
    name: 'home', 
    path: '/', 
    onEnterRoute: async (_state, _fromState) => {
      console.log('[Route] onEnterRoute callback');
    }, 
    onExitRoute: async (_state, _fromState) => {
      console.log('[Route] onExitRoute callback');
    }
  },
  {
    name: 'about', 
    path: '/about', 
    onEnterRoute: async (_state, _fromState) => {
      console.log('[Route] onEnterRoute callback');
    }
  },
  {
    name: 'profile', 
    path: '/profile/:userId', 
    onEnterRoute: async (_state, _fromState) => {
      console.log('[Route] onEnterRoute callback');
    }, 
    onRouteInActiveChain: async (_state, _fromState) => {
      console.log('[Route] onRouteInActiveChain callback');
    }, 
    children: [
      {
        name: 'edit', 
        browserTitle: async (state) => `Редактировать профиль пользователя ${state.params.userId}`, 
        path: '/edit', 
        onEnterRoute: async (_state, _fromState) => {
          console.log('[Route] onEnterRoute callback');
        }
      },
      {
        name: 'view', 
        browserTitle: 'Профиль пользователя', 
        path: '/view', 
        onEnterRoute: async (_state, _fromState) => {
          console.log('[Route] onEnterRoute callback');
        }
      }
    ]
  },
];

// Инициализация роутера с плагинами ДО start
const router: Router = createRouter(routes, {
  allowNotFound: true
});
router.usePlugin(loggerPlugin);
router.usePlugin(browserPlugin());
router.start();

console.log('[router-demo] Router started');

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



function AppLayout() {
  const { router } = useRoute();
  
  const isProfileActive = router.isActive('profile');
  console.log('[AppLayout] isProfileActive:', isProfileActive);

  return <> <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
    <Link routeName="home">Главная</Link>
    <Link routeName="about">О проекте</Link>
    <Link routeName="profile" routeParams={{ userId: '42' }}>
      Профиль
    </Link>
  </nav>
    {isProfileActive && <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      <Link routeName="profile.edit" routeParams={{ userId: '42' }}>
        Редактировать профиль
      </Link>
      <Link routeName="profile.view" routeParams={{ userId: '42' }}>
        Профиль
      </Link>
    </nav>}
    <RouteNode nodeName="home">
      {() => <Home />}
    </RouteNode>
    <RouteNode nodeName="about">
      {() => <About />}
    </RouteNode>
    <RouteNode nodeName="profile">
      {({ route }) => <Profile userId={route.params.userId} />}
    </RouteNode>
    <RouteNode nodeName="profile.edit">
      {({ route }) => <div><Profile userId={route.params.userId} /><p>Режим редактирования</p></div>}
    </RouteNode>
    <RouteNode nodeName="profile.view">
      {({ route }) => <div><Profile userId={route.params.userId} /><p>Режим просмотра</p></div>}
    </RouteNode>
    <RouteNode nodeName="@@router/UNKNOWN_ROUTE">
      {() => <NotFound />}
    </RouteNode></>
}

export default function App() {
  return (
    <RouterProvider router={router}>
      <AppLayout />
    </RouterProvider>
  );
}

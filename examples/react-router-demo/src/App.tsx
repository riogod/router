import { createRouter, type Route, type Router, type DefaultDependencies } from '@riogz/router';
import { RouterProvider, Link, RouteNode, useRoute } from '@riogz/react-router';
import browserPlugin from '@riogz/router-plugin-browser';
import loggerPlugin from '@riogz/router-plugin-logger';


interface Dependencies extends DefaultDependencies {
  my_dep: string;
  router: Router<Dependencies>;
}

const routes: Route<Dependencies>[] = [
  {
    name: 'home', 
    path: '/home',
    onEnterNode: async (_state, _fromState, deps) => {
      console.log('[Route] onEnterNode callback', deps.my_dep);
    },
    onExitNode: async (_state, _fromState, _deps) => {
      console.log('[Route] onExitNode callback');
    }
  },
  {
    name: 'about', 
    path: '/about',
    onEnterNode: async (_state, _fromState) => {
      console.log('[Route] onEnterNode callback');
    }
  },
  {
    name: 'contact',
    path: '/contact', 
    onEnterNode: async (_state, _fromState) => {
      console.log('[Route] onEnterNode callback');
    },
    onNodeInActiveChain: async (_state, _fromState, _deps) => {
      console.log('[Route] onNodeInActiveChain callback');
    }
  },
  {
    name: 'profile', 
    path: '/profile/:userId', 
    onEnterNode: async (_state, _fromState) => {
      console.log('[Route] onEnterNode callback');
    }, 
    onNodeInActiveChain: async (_state, _fromState) => {
      console.log('[Route] onNodeInActiveChain callback');
    }, 
    children: [
      {
        name: 'edit', 
        browserTitle: async (state, deps) => `Редактировать профиль пользователя ${state.params.userId}`, 
        path: '/edit', 
        onEnterNode: async (_state, _fromState) => {
          console.log('[Route] onEnterNode callback');
        }
      },
      {
        name: 'view', 
        browserTitle: 'Профиль пользователя', 
        path: '/view', 
        onEnterNode: async (_state, _fromState) => {
          console.log('[Route] onEnterNode callback');
        }
      }
    ]
  },
];

// Инициализация роутера с плагинами ДО start
const router: Router<Dependencies> = createRouter(routes, {
  allowNotFound: true
});
router.usePlugin(loggerPlugin);
router.usePlugin(browserPlugin());
router.setDependency("my_dep", "my_dep_value");
router.setDependency("router", router);
router.start();

console.log('[router-demo] Router started');

function Home() {
  console.log('[RouteNode] Home');
  return <h2>Главная страница</h2>;
}
function About() {
  const { route } = useRoute();
  
  console.log('[RouteNode] About');
  return <h2>О проекте {route.name}</h2>;
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
      <Home />
    </RouteNode>
    <RouteNode nodeName="about" children={About} />
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

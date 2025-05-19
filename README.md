[![npm version](https://badge.fury.io/js/@riogz%2Frouter.svg)](https://badge.fury.io/js/@riogz%2Frouter)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

# @riogz/router 

@riogz/router is a **framework and view library agnostic router** and is a modern continuation of router5.

- **view / state separation**: router processes routing **instructions** and outputs **state** updates.
- **universal**: works client-side and server-side
- **simple**: define your routes, start to listen to route changes
- **flexible**: you have control over transitions and what happens on transitions


```javascript
import createRouter from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'profile', path: '/profile' }
]

const router = createRouter(routes)

router.usePlugin(browserPlugin())

router.start()
```

**With React \(hooks\)**

```javascript
import React from 'react'
import ReactDOM from 'react-dom'
import { RouterProvider, RouteNode } from '@riogz/react-router'

function App() {
  
  return 
  <>
  <RouteNode nodeName="home">
    Home Page
  </RouteNode>
  <RouteNode nodeName="profile">
    {({ route }) => <Profile userId={route.params.userId} />}
  </RouteNode>
  </>
}

ReactDOM.render(
  <RouterProvider router={router}>
    <App />
  </RouterProvider>,
  document.getElementById('root')
)
```



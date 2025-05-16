# helpers

Helpers for comparing and checking routes.


## API

_route can be a route name (string) or state object containing a name property_

- __startsWithSegment(route, segment)__
- __endsWithSegment(route, segment)__
- __includesSegment(route, segment)__


### All functions are available in their curried form (kinda)

- __startsWithSegment(route)(segment)__
- __endsWithSegment(route)(segment)__
- __includesSegment(route)(segment)__

```javascript
import * as helpers from 'router-helpers';

startsWithSegment('users', 'users');      // => true
startsWithSegment('users.list', 'users'); // => true

startsWithSegment('users.list')('users'); // => true
```

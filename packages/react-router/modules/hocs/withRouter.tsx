import type{ ComponentType, FC } from 'react'
import { Router } from '@riogz/router'
import { routerContext } from '../context'

function withRouter<P>(
    BaseComponent: ComponentType<P & { router: Router }>
): FC<Omit<P, 'router'>> {
    return function WithRouter(props: P) {
        return (
            <routerContext.Consumer>
                {router => <BaseComponent {...props} router={router} />}
            </routerContext.Consumer>
        )
    }
}

export default withRouter

import { Path, URLParamsEncodingType } from '../path-parser'
import { IOptions as QueryParamsOptions } from '../search-params'

import {
  buildPathFromSegments,
  buildStateFromMatch,
  getMetaFromSegments,
  getPathFromSegments
} from './helpers'
import matchChildren from './matchChildren'
import sortChildren from './sortChildren'

export interface RouteDefinition {
  name: string
  path: string
  [key: string]: any
}
export type Route = RouteNode | RouteDefinition
export type Callback = (...args: any[]) => void
export type TrailingSlashMode = 'default' | 'never' | 'always'
export type QueryParamsMode = 'default' | 'strict' | 'loose'

export interface BuildOptions {
  trailingSlashMode?: TrailingSlashMode
  queryParamsMode?: QueryParamsMode
  queryParams?: QueryParamsOptions
  urlParamsEncoding?: URLParamsEncodingType
}

export interface MatchOptions {
  caseSensitive?: boolean
  trailingSlashMode?: TrailingSlashMode
  queryParamsMode?: QueryParamsMode
  queryParams?: QueryParamsOptions
  strictTrailingSlash?: boolean
  strongMatching?: boolean
  urlParamsEncoding?: URLParamsEncodingType
}

export type { QueryParamsOptions }

export interface MatchResponse {
  segments: RouteNode[]
  params: Record<string, any>
}

export interface RouteNodeStateMeta {
  [routeName: string]: {
    [routeParams: string]: 'query' | 'url'
  }
}

export interface RouteNodeState {
  name: string
  params: Record<string, any>
  meta: RouteNodeStateMeta
}

export interface RouteNodeOptions {
  finalSort?: boolean
  onAdd?: Callback
  parent?: RouteNode
  sort?: boolean
}

export class RouteNode {
  public name: string
  public absolute: boolean
  public path: string
  public parser: Path | null
  public children: RouteNode[]
  public parent?: RouteNode

  constructor(
    name: string = '',
    path: string = '',
    childRoutes: Route[] = [],
    options: RouteNodeOptions = {}
  ) {
    this.name = name
    this.absolute = /^~/.test(path)
    this.path = this.absolute ? path.slice(1) : path

    this.parser = this.path ? new Path(this.path) : null
    this.children = []
    this.parent = options.parent

    this.checkParents()

    this.add(
      childRoutes,
      options.onAdd,
      options.finalSort ? false : options.sort !== false
    )

    if (options.finalSort) {
      this.sortDescendants()
    }

    return this
  }

  public getParentSegments(segments: RouteNode[] = []): RouteNode[] {
    return this.parent && this.parent.parser
      ? this.parent.getParentSegments(segments.concat(this.parent))
      : segments.reverse()
  }

  public setParent(parent: RouteNode) {
    this.parent = parent
    this.checkParents()
  }

  public setPath(path: string = '') {
    this.path = path
    this.parser = path ? new Path(path) : null
  }

  public add(
    route: Route | Route[],
    cb?: Callback,
    sort: boolean = true
  ): this {
    if (route === undefined || route === null) {
      return this
    }

    if (route instanceof Array) {
      route.forEach(r => this.add(r, cb, sort))
      return this
    }

    if (!(route instanceof RouteNode) && !(route instanceof Object)) {
      throw new Error(
        'RouteNode.add() expects routes to be an Object or an instance of RouteNode.'
      )
    } else if (route instanceof RouteNode) {
      route.setParent(this)
      this.addRouteNode(route, sort)
    } else {
      if (!route.name || !route.path) {
        throw new Error(
          'RouteNode.add() expects routes to have a name and a path defined.'
        )
      }

      const routeNode = new RouteNode(route.name, route.path, [], {
        finalSort: false,
        onAdd: cb,
        parent: this,
        sort
      })

      for (const key in route) {
        if (Object.prototype.hasOwnProperty.call(route, key)) {
          if (!['name', 'path', 'children'].includes(key)) {
            (routeNode as any)[key] = (route as any)[key]
          }
        }
      }

      if (route.children && route.children.length > 0) {
        routeNode.add(route.children, cb, sort)
      }

      const fullName = routeNode
        .getParentSegments([routeNode])
        .map(_ => _.name)
        .join('.')
      if (cb) {
        cb({
          ...route,
          name: fullName
        })
      }
      this.addRouteNode(routeNode, sort)
    }

    return this
  }

  public addNode(name: string, path: string) {
    this.add(new RouteNode(name, path))
    return this
  }

  /**
   * Removes a direct child RouteNode by its name.
   * If the name is a composite (e.g., 'parent.child'), it will attempt to remove 'parent' from this node's children.
   * 
   * @param name The name of the child node to remove.
   * @returns True if the child node was found and removed, false otherwise.
   */
  public removeNode(name: string): boolean {
    const targetName = name.split('.')[0];
    const initialChildrenCount = this.children.length;
    this.children = this.children.filter(child => child.name !== targetName);
    return this.children.length < initialChildrenCount;
  }

  public getPath(routeName: string): string | null {
    const segmentsByName = this.getSegmentsByName(routeName)

    return segmentsByName ? getPathFromSegments(segmentsByName) : null
  }

  public getNonAbsoluteChildren(): RouteNode[] {
    return this.children.filter(child => !child.absolute)
  }

  public sortChildren() {
    if (this.children.length) {
      sortChildren(this.children)
    }
  }

  public sortDescendants() {
    this.sortChildren()
    this.children.forEach(child => child.sortDescendants())
  }

  /**
   * Creates a deep clone of this RouteNode and all its children.
   * The cloned node will have the same structure but be completely independent.
   * 
   * @returns A new RouteNode instance that is a deep copy of this node
   */
  public clone(): RouteNode {
    const clonedNode = new RouteNode(
      this.name,
      this.absolute ? `~${this.path}` : this.path,
      [], // Children will be added by reconstructing from childRoutes if necessary, or handled by subsequent .add calls
      { finalSort: false } // Ensure sort is not prematurely done if children are added later
    );

    // Copy other custom properties from `this` to `clonedNode`
    for (const key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        if (!['name', 'path', 'children', 'parent', 'absolute', 'parser'].includes(key)) {
          (clonedNode as any)[key] = (this as any)[key];
        }
      }
    }

    // After custom props are copied, now add children definitions (if any) to the clone
    // This ensures that if children themselves have custom props, they are handled by the standard `add` process
    if (this.children.length > 0) {
      this.children.forEach(child => {
        clonedNode.add(child.clone(), undefined, false); // Add a CLONE of the child
      });
    }

    // If the original node had finalSort true in its options, we might want to call sortDescendants
    // For now, the caller of clone or subsequent operations should handle final sorting if needed.
    // Example: if clone is used in `addRouteNode`, the `sort` param there will handle it for the parent.

    return clonedNode;
  }

  /**
   * Helper method to recursively convert a RouteNode to a RouteDefinition
   * @private
   */
  private convertNodeToDefinition(node: RouteNode): RouteDefinition {
    const definition: RouteDefinition = {
      name: node.name,
      path: node.absolute ? `~${node.path}` : node.path
    }

    if (node.children.length > 0) {
      definition.children = node.children.map(child => this.convertNodeToDefinition(child))
    }

    return definition
  }

  public buildPath(
    routeName: string,
    params: Record<string, any> = {},
    options: BuildOptions = {}
  ): string {
    const segments = this.getSegmentsByName(routeName)

    if (!segments) {
      throw new Error(`[route-node][buildPath] '${routeName}' is not defined`);
    }

    return buildPathFromSegments(segments, params, options)
  }

  public buildState(
    name: string,
    params: Record<string, any> = {}
  ): RouteNodeState | null {
    const segments = this.getSegmentsByName(name)

    if (!segments || !segments.length) {
      return null
    }

    return {
      name,
      params,
      meta: getMetaFromSegments(segments)
    }
  }

  public matchPath(
    path: string,
    options: MatchOptions = {}
  ): RouteNodeState | null {
    if (path === '' && !options.strictTrailingSlash) {
      path = '/'
    }

    const match = this.getSegmentsMatchingPath(path, options)

    if (!match) {
      return null
    }

    const matchedSegments = match.segments

    if (matchedSegments[0].absolute) {
      const firstSegmentParams = matchedSegments[0].getParentSegments()

      matchedSegments.reverse()
      matchedSegments.push(...firstSegmentParams)
      matchedSegments.reverse()
    }

    const lastSegment = matchedSegments[matchedSegments.length - 1]
    const lastSegmentSlashChild = lastSegment.findSlashChild()

    if (lastSegmentSlashChild) {
      matchedSegments.push(lastSegmentSlashChild)
    }

    return buildStateFromMatch(match)
  }

  private _updateWith(sourceNode: RouteNode, sortChildrenFlag: boolean): void {
    // 1. Update path (with sibling conflict check)
    // Update path only if it's different, and check for conflicts
    if (this.path !== sourceNode.path) {
      if (this.parent) { // Path conflict check is relevant if there's a parent with other children
        const conflictingSibling = this.parent.children.find(
          sibling => sibling !== this && sibling.path === sourceNode.path
        );
        if (conflictingSibling) {
          throw new Error(
            `Path "${sourceNode.path}" for route "${this.name}" conflicts with existing sibling route "${conflictingSibling.name}".`
          );
        }
      }
      this.setPath(sourceNode.path);
    }

    // 2. Update other relevant properties from sourceNode to `this`.
    // We iterate over all keys in sourceNode. Properties like 'name', 'children', 'parent',
    // 'absolute', and 'parser' are handled by other parts of the logic or are intrinsic
    // to the node's identity and structure, so we skip them here.
    // The 'path' is handled above with setPath.
    for (const key in sourceNode) {
      if (Object.prototype.hasOwnProperty.call(sourceNode, key)) {
        if (!['name', 'path', 'children', 'parent', 'absolute', 'parser'].includes(key)) {
          // Directly assign the value from sourceNode to this node.
          // This allows custom properties from RouteDefinition to be transferred.
          (this as any)[key] = (sourceNode as any)[key];
        }
      }
    }

    // 3. Update/add child nodes.
    // Child nodes from `sourceNode` are used to update/add to the child nodes of `this`.
    // Existing child nodes in `this` that are not mentioned by name in `sourceNode.children` will remain.
    if (sourceNode.children && sourceNode.children.length > 0) {
      sourceNode.children.forEach(childFromSource => {
        // Call addRouteNode on `this` (the node being updated) for each child from the source.
        // `addRouteNode` will handle updating an existing child or adding a new one.
        const childClone = childFromSource.clone(); // Clone the child from source
        // Ensure the clone has no parent initially, so it can be correctly parented by `this`
        // if added as a new node, or its properties used for update if it matches an existing child of `this`.
        // The clone() method already ensures the new node has no parent.
        this.addRouteNode(childClone, false); // Defer sorting until the end
      });
    }

    if (sortChildrenFlag) {
      this.sortChildren();
    }
  }

  private addRouteNode(route: RouteNode, sort: boolean = true): this {
    const names = route.name.split('.');

    if (names.length === 1) {
      // Find an existing child node with the same name
      const existingChild = this.children.find(child => child.name === route.name);

      if (existingChild) {
        // === UPDATE EXISTING CHILD NODE ===
        existingChild._updateWith(route, sort); // Use the helper method to update
      } else {
        // === ADD NEW CHILD NODE ===
        // Check for duplicate path only among other existing child nodes
        if (this.children.some(child => child.path === route.path)) {
          throw new Error(
            `Path "${route.path}" is already defined in another route node ("${this.children.find(c => c.path === route.path)?.name || 'unknown'}") at this level.`
          );
        }
        route.setParent(this); // Ensure parent is set before adding
        this.children.push(route);
        if (sort) {
          this.sortChildren();
        }
      }
    } else {
      const parentName = names.slice(0, -1).join('.');
      const childSimpleName = names[names.length - 1];

      // Check if direct parent is current node without aliasing this
      const currentLastSegment = this.name.split('.').pop();
      if (parentName === this.name || parentName === currentLastSegment) {
        const nodeToProcess = route.clone();
        nodeToProcess.name = childSimpleName;
        this.add(nodeToProcess, undefined, sort);
      } else {
        const segments = this.getSegmentsByName(parentName);
        if (segments && segments.length > 0) {
          const directParentNode = segments[segments.length - 1];
          const nodeToProcess = route.clone();
          nodeToProcess.name = childSimpleName;
          directParentNode.add(nodeToProcess, undefined, sort);
        } else {
          throw new Error(
            `Could not add route named '${names.join('.')}', parent segment '${parentName}' is missing.`
          );
        }
      }
    }
    return this;
  }

  private checkParents() {
    if (this.absolute && this.hasParentsParams()) {
      throw new Error(
        '[RouteNode] A RouteNode with an abolute path cannot have parents with route parameters'
      )
    }
  }

  private hasParentsParams(): boolean {
    if (this.parent && this.parent.parser) {
      const parser = this.parent.parser
      const hasParams =
        parser.hasUrlParams ||
        parser.hasSpatParam ||
        parser.hasMatrixParams ||
        parser.hasQueryParams

      return hasParams || this.parent.hasParentsParams()
    }

    return false
  }

  private findAbsoluteChildren(): RouteNode[] {
    return this.children.reduce<RouteNode[]>(
      (absoluteChildren, child) =>
        absoluteChildren
          .concat(child.absolute ? child : [])
          .concat(child.findAbsoluteChildren()),
      []
    )
  }

  private findSlashChild(): RouteNode | undefined {
    const slashChildren = this.getNonAbsoluteChildren().filter(
      child => child.parser && /^\/(\?|$)/.test(child.parser.path)
    )

    return slashChildren[0]
  }

  private getSegmentsByName(routeName: string): RouteNode[] | null {
    const findSegmentByName = (name: string, routes: RouteNode[]) => {
      const filteredRoutes = routes.filter(r => r.name === name)
      return filteredRoutes.length ? filteredRoutes[0] : undefined
    }
    const segments: RouteNode[] = []
    let routes = this.parser ? [this] : this.children
    const names = (this.parser ? [''] : []).concat(routeName.split('.'))

    const matched = names.every(name => {
      const segment = findSegmentByName(name, routes)
      if (segment) {
        routes = segment.children
        segments.push(segment)
        return true
      }
      return false
    })

    return matched ? segments : null
  }

  private getSegmentsMatchingPath(
    path: string,
    options: MatchOptions
  ): MatchResponse | null {
    const topLevelNodes = this.parser ? [this] : this.children
    const startingNodes = topLevelNodes.reduce<RouteNode[]>(
      (nodes, node) => nodes.concat(node, node.findAbsoluteChildren()),
      []
    )

    const currentMatch = {
      segments: [],
      params: {}
    }

    const finalMatch = matchChildren(startingNodes, path, currentMatch, options)

    if (
      finalMatch &&
      finalMatch.segments.length === 1 &&
      finalMatch.segments[0].name === ''
    ) {
      return null
    }

    return finalMatch
  }
}
/**
 * We encode using encodeURIComponent but we want to
 * preserver certain characters which are commonly used
 * (sub delimiters and ':')
 * 
 * https://www.ietf.org/rfc/rfc3986.txt
 * 
 * reserved    = gen-delims / sub-delims
 * 
 * gen-delims  = ":" / "/" / "?" / "#" / "[" / "]" / "@"
 * 
 * sub-delims  = "!" / "$" / "&" / "'" / "(" / ")"
              / "*" / "+" / "," / ";" / "="
 */

const excludeSubDelimiters = /[^!$'()*+,;|:]/g

export type URLParamsEncodingType =
  | 'default'
  | 'uri'
  | 'uriComponent'
  | 'none'
  | 'legacy'

export const encodeURIComponentExcludingSubDelims = (segment: string): string => {
  try {
    return segment.replace(excludeSubDelimiters, match => {
      try {
        return encodeURIComponent(match)
      } catch (error) {
        // If encodeURIComponent fails (e.g., with malformed Unicode),
        // return the original character to avoid breaking the entire operation
        return match
      }
    })
  } catch (error) {
    // If the entire operation fails, fall back to basic encoding
    // that preserves Unicode characters
    try {
      return encodeURI(segment)
    } catch (fallbackError) {
      // Last resort: return the original segment
      return segment
    }
  }
}

const encodingMethods: Record<
  URLParamsEncodingType,
  (param: string) => string
> = {
  default: encodeURIComponentExcludingSubDelims,
  uri: encodeURI,
  uriComponent: encodeURIComponent,
  none: val => val,
  legacy: encodeURI
}

const decodingMethods: Record<
  URLParamsEncodingType,
  (param: string) => string
> = {
  default: decodeURIComponent,
  uri: decodeURI,
  uriComponent: decodeURIComponent,
  none: val => val,
  legacy: decodeURIComponent
}

export const encodeParam = (
  param: string | number | boolean,
  encoding: URLParamsEncodingType,
  isSpatParam: boolean
): string => {
  const encoder =
    encodingMethods[encoding] || encodeURIComponentExcludingSubDelims

  if (isSpatParam) {
    return String(param)
      .split('/')
      .map(encoder)
      .join('/')
  }

  return encoder(String(param))
}

export const decodeParam = (
  param: string,
  encoding: URLParamsEncodingType
): string => (decodingMethods[encoding] || decodeURIComponent)(param)
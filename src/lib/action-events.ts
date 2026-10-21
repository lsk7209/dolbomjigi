const actions = ['product_official_open','support_source_open','compare_product_open','correction_request_open'] as const
export type ActionName = typeof actions[number]
/** Only fixed action names and our own route; no href, query, text, identifiers or forms. */
export function actionEvent(action:string|undefined, pathname:string) {
  if (!actions.includes(action as ActionName) || !/^\/[a-z0-9/_-]*$/i.test(pathname)) return null
  return { name:`dolbom_${action}`, params:{page_path:pathname} }
}

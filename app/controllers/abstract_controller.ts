export default class AbstractController {
  protected buildJSONResponse(body?: any) {
    return {
      success: true,
      ...body,
    }
  }
}

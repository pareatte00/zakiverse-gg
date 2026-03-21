import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
} from "axios"

export type xAxiosRequestBase = {
  url: string
  bearerToken?: string
  serviceKey?: string
  header?: Record<string, string>

  params?: Record<string, any>
}

export type xAxiosGet = xAxiosRequestBase & { data?: any }

export type xAxiosPost = xAxiosRequestBase & { data?: any }

export type xAxiosPut = xAxiosRequestBase & { data?: any }

export type xAxiosDelete = xAxiosRequestBase & { data?: any }

export type xAxiosPatch = xAxiosRequestBase & { data?: any }

export type xAxiosHead = xAxiosRequestBase

export type xAxiosOptions = xAxiosRequestBase

export type xAxiosReturnData<T> = {
  response: T | null
  status: HttpStatusCode
}

class xAxios {
  private baseRequest: AxiosInstance

  constructor(baseUrl?: string) {
    this.baseRequest = axios.create({
      baseURL: baseUrl,
      timeout: 60000,
    })
  }

  private buildConfig(param: xAxiosRequestBase & { data?: any }): AxiosRequestConfig {
    const headers: Record<string, string> = {
      ...(param.header ?? {}),
      ...(param.bearerToken ? { Authorization: `Bearer ${param.bearerToken}` } : {}),
      ...(param.serviceKey ? { "X-System-Key": param.serviceKey } : {}),
    }

    return {
      headers,
      params: param.params,
      data:   param.data,
    }
  }

  private async handleRequest<T>(
    method: AxiosRequestConfig["method"],
    url: string,
    config: AxiosRequestConfig,
  ): Promise<xAxiosReturnData<T>> {
    try {
      const response: AxiosResponse<T> = await this.baseRequest.request<T>({
        method,
        url,
        ...config,
      })

      return {
        response: response.data,
        status:   response.status ?? HttpStatusCode.UnprocessableEntity,
      }
    }
    catch (err) {
      const error = err as AxiosError<T>
      const response = error.response

      return {
        response: response?.data ?? null,
        status:   response?.status ?? HttpStatusCode.InternalServerError,
      }
    }
  }

  public async get<T>(param: xAxiosGet): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("get", param.url, this.buildConfig(param))
  }

  public async post<T>(param: xAxiosPost): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("post", param.url, this.buildConfig(param))
  }

  public async put<T>(param: xAxiosPut): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("put", param.url, this.buildConfig(param))
  }

  public async delete<T>(param: xAxiosDelete): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("delete", param.url, this.buildConfig(param))
  }

  public async patch<T>(param: xAxiosPatch): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("patch", param.url, this.buildConfig(param))
  }

  public async head<T>(param: xAxiosHead): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("head", param.url, this.buildConfig(param))
  }

  public async options<T>(param: xAxiosOptions): Promise<xAxiosReturnData<T>> {
    return this.handleRequest<T>("options", param.url, this.buildConfig(param))
  }
}

const usexAxios = (baseUrl?: string): xAxios => new xAxios(baseUrl)

export default usexAxios
